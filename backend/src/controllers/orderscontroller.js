// backend/src/controllers/orderscontroller.js
const pool = require("../../config/db");
const membership = require("../services/membership"); // 👈 thêm dòng này

const {
  sendOrderEmailCreated,
  sendOrderEmailPaid,
  sendOrderEmailCancelled,
} = require("../lib/mailer");
/** Helper: lấy CartID theo user (tạo nếu chưa có) */
async function getCartIdByUser(userId, client = pool) {
  const r = await client.query(
    `SELECT cartid FROM shoppingcart WHERE userid=$1`,
    [userId]
  );
  if (!r.rows.length) {
    const ins = await client.query(
      `INSERT INTO shoppingcart(userid) VALUES($1) RETURNING cartid`,
      [userId]
    );
    return ins.rows[0].cartid;
  }
  return r.rows[0].cartid;
}
 

const ordersController = {
  cancelOrder: async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const isAdmin = req.user?.role === "admin";
    const orderId = Number(req.params.id);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const oR = await client.query(
        `SELECT orderid, userid, orderstatus
           FROM productorders
          WHERE orderid=$1
          FOR UPDATE`,
        [orderId]
      );
      if (!oR.rows.length) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "Not found" });
      }

      const order = oR.rows[0];
      if (!isAdmin && order.userid !== userId) {
        await client.query("ROLLBACK");
        return res.status(403).json({ message: "Forbidden" });
      }

      if (order.orderstatus !== "pending") {
        await client.query("ROLLBACK");
        return res
          .status(400)
          .json({ message: "Only pending orders can be cancelled" });
      }

      await restoreStockForOrder(orderId, client);

      const uR = await client.query(
        `UPDATE productorders
            SET orderstatus='cancelled'
          WHERE orderid=$1
          RETURNING *`,
        [orderId]
      );

      await client.query("COMMIT");

      // Notify + email
      try {
        await notifyUser(
          order.userid,
          "Đơn hàng đã hủy",
          `Đơn #${orderId} đã được hủy.`
        );
        const u = await pool.query(
          `SELECT username, email FROM users WHERE userid=$1`,
          [order.userid]
        );
        await sendOrderEmailCancelled(uR.rows[0], u.rows[0]);
      } catch (e) {
        console.warn("cancelOrder notify/email warn:", e?.message);
      }

      return res.json(uR.rows[0]);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("cancelOrder error:", err);
      return res.status(500).json({ message: "Server error" });
    } finally {
      client.release();
    }
  },
  /** POST /api/orders — tạo đơn từ giỏ hàng */
  checkoutFromCart: async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const {
      shippingAddress = null,
      paymentMethod = null,
      notes = null,
      shippingFee = 0,
    } = req.body || {};

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const cartId = await getCartIdByUser(userId, client);
      // Lấy cart + join products để có stock, price, discount

      const itemsR = await client.query(
        `SELECT sci.itemid, sci.productid, sci.quantity, sci.unitprice,   -- LẤY GIÁ CHỐT TỪ GIỎ
          p.productname, p.stock, p.isvisible
     FROM shoppingcartitems sci
     JOIN products p ON p.productid = sci.productid
    WHERE sci.cartid = $1
    ORDER BY sci.itemid ASC`,
        [cartId]
      );
      const cartItems = itemsR.rows || [];
      if (!cartItems.length) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "Cart is empty" });
      }

      // Re-validate stock/visibility như cũ…

      // CHỐT GIÁ = GIÁ TỪ GIỎ
      const enriched = cartItems.map((it) => {
        const serverUnit = Number(it.unitprice); // <-- quan trọng
        const subtotal = serverUnit * Number(it.quantity);
        return { ...it, serverUnit, subtotal };
      });

      const totalProducts = enriched.reduce((s, x) => s + x.subtotal, 0);
      const totalAmount = totalProducts + Number(shippingFee || 0);

      // Tạo đơn
      const orderIns = await client.query(
        `INSERT INTO productorders
         (userid, totalamount, shippingaddress, shippingfee, orderstatus, paymentmethod, paymentstatus, notes)
       VALUES ($1,$2,$3,$4,'pending',$5,'unpaid',$6)
       RETURNING orderid, orderdate, orderstatus, paymentstatus`,
        [
          userId,
          totalAmount,
          shippingAddress,
          shippingFee,
          paymentMethod,
          notes,
        ]
      );
      const order = orderIns.rows[0];
      const orderId = order.orderid;

      // Thêm chi tiết đơn (trigger của bạn sẽ tự trừ kho)
      for (const it of enriched) {
        await client.query(
          `INSERT INTO productorderdetails
           (orderid, productid, optionid, quantity, unitprice, subtotal)
         VALUES ($1,$2,NULL,$3,$4,$5)`,
          [orderId, it.productid, it.quantity, it.serverUnit, it.subtotal]
        );
      }

      // Xoá giỏ user
      await client.query(`DELETE FROM shoppingcartitems WHERE cartid=$1`, [
        cartId,
      ]);

      await client.query("COMMIT");
      // Lấy thông tin user để gửi mail (đơn giản)
      try {
        const uR = await pool.query(
          `SELECT userid, username, email FROM users WHERE userid=$1`,
          [userId]
        );
        const user = uR.rows[0];
        await sendOrderEmailCreated(
          { orderid: orderId, ...order, totalamount: totalAmount },
          user
        );
      } catch (e) {
        console.warn("sendOrderEmailCreated error", e?.message);
      }
      return res.status(201).json({
        orderId,
        orderDate: order.orderdate,
        totalAmount,
        totalProducts,
        shippingFee,
        orderStatus: order.orderstatus,
        paymentStatus: order.paymentstatus,
        items: enriched.map((i) => ({
          productid: i.productid,
          productname: i.productname,
          quantity: i.quantity,
          unitprice: i.serverUnit,
          subtotal: i.subtotal,
        })),
      });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("checkoutFromCart error:", err);
      res.status(500).json({ message: "Server error" });
    } finally {
      client.release();
    }
  },

  /** GET /api/orders — đơn của chính user (admin có thể ?all=1) */
  /** GET /api/orders — đơn của chính user (admin có thể ?all=1) */
  listMyOrders: async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const isAdmin = req.user?.role === "admin";
    const showAll = isAdmin && String(req.query.all || "") === "1";

    try {
      const r = await pool.query(
        showAll
          ? `
            SELECT 
              o.orderid,
              o.userid,
              o.orderdate,
              o.totalamount,
              o.orderstatus,
              o.paymentstatus,
              (
                SELECT string_agg(DISTINCT p.productname, ', ' ORDER BY p.productname)
                FROM productorderdetails d
                JOIN products p ON p.productid = d.productid
                WHERE d.orderid = o.orderid
              ) AS productnames
            FROM productorders o
            ORDER BY o.orderid DESC
          `
          : `
            SELECT 
              o.orderid,
              o.orderdate,
              o.totalamount,
              o.orderstatus,
              o.paymentstatus,
              (
                SELECT string_agg(DISTINCT p.productname, ', ' ORDER BY p.productname)
                FROM productorderdetails d
                JOIN products p ON p.productid = d.productid
                WHERE d.orderid = o.orderid
              ) AS productnames
            FROM productorders o
            WHERE o.userid = $1
            ORDER BY o.orderid DESC
          `,
        showAll ? [] : [userId]
      );

      res.json(r.rows);
    } catch (err) {
      console.error("listMyOrders error:", err);
      res.status(500).json({ message: "Server error" });
    }
  },

  /** GET /api/orders/:id — chi tiết đơn (user chỉ xem đơn của mình) */
  getOrderDetail: async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const isAdmin = req.user?.role === "admin";
    const orderId = Number(req.params.id);

    try {
      const oR = await pool.query(
        `SELECT orderid, userid, orderdate, totalamount, shippingaddress, shippingfee,
                orderstatus, paymentmethod, paymentstatus, notes
           FROM productorders
          WHERE orderid=$1`,
        [orderId]
      );
      if (!oR.rows.length)
        return res.status(404).json({ message: "Not found" });

      const order = oR.rows[0];
      if (!isAdmin && order.userid !== userId)
        return res.status(403).json({ message: "Forbidden" });

      const dR = await pool.query(
        `SELECT d.detailid, d.productid, p.productname, d.quantity, d.unitprice, d.subtotal
           FROM productorderdetails d
           JOIN products p ON p.productid = d.productid
          WHERE d.orderid=$1
          ORDER BY d.detailid ASC`,
        [orderId]
      );

      res.json({ ...order, items: dR.rows });
    } catch (err) {
      console.error("getOrderDetail error:", err);
      res.status(500).json({ message: "Server error" });
    }
  },

  /** PATCH /api/orders/:id/cancel — user hủy khi đang pending */
  /** PATCH /api/orders/:id/cancel — user hủy khi đang pending */
  /** PATCH /api/orders/:id/cancel — user (hoặc admin) hủy khi đang pending */
};
/** Cộng trả tồn kho cho toàn bộ sản phẩm trong đơn */
async function restoreStockForOrder(orderId, client) {
  // Cộng tổng quantity theo productid của order này
  await client.query(`
    UPDATE products p
       SET stock = p.stock + d.qty
      FROM (
        SELECT productid, SUM(quantity)::int AS qty
          FROM productorderdetails
         WHERE orderid = $1
         GROUP BY productid
      ) d
     WHERE p.productid = d.productid
  `, [orderId]);
}

/** Notifications (đơn giản) */
async function ensureNotificationSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS Notifications (
      id SERIAL PRIMARY KEY,
      userid INT NOT NULL,
      type VARCHAR(30) DEFAULT 'order',
      title TEXT,
      message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      read_at TIMESTAMP,
      FOREIGN KEY (userid) REFERENCES Users(UserID) ON DELETE CASCADE
    )
  `);
}
ensureNotificationSchema().catch(console.error);

async function notifyUser(userId, title, message) {
  try {
    await pool.query(
      `INSERT INTO Notifications(userid, title, message) VALUES($1,$2,$3)`,
      [userId, title, message]
    );
  } catch (e) {
    console.error("notifyUser error:", e);
  }
}

const ALLOWED_ADMIN_STATUS = new Set([
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);

function buildNoteTracked(oldNotes, newNote, carrier, tracking) {
  let lines = [];
  if (oldNotes) lines.push(oldNotes);
  if (newNote) lines.push(newNote);
  if (carrier || tracking)
    lines.push(`[carrier: ${carrier || ""}][tracking: ${tracking || ""}]`);
  return lines.join("\n").trim() || null;
}

/** User cancel cho phép ở pending/processing (API phụ) */
/** User cancel cho phép ở pending/processing (API phụ) */
/** POST|PATCH /api/orders/:id/cancel — user tự hủy (cho phép pending/processing tùy yêu cầu) */
async function userCancel(req, res) {
  const client = await pool.connect();
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const orderId = Number(id);

    await client.query("BEGIN");

    const r = await client.query(
      `SELECT orderid, userid, orderstatus
         FROM productorders
        WHERE orderid=$1 AND userid=$2
        FOR UPDATE`,
      [orderId, userId]
    );
    if (!r.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Order not found" });
    }

    const o = r.rows[0];
    // Cho phép huỷ khi pending (nếu muốn cho cả 'processing' thì thêm vào mảng)
    if (!["pending"].includes(o.orderstatus)) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ message: "Order cannot be cancelled at this stage" });
    }

    // Cộng trả tồn kho
    await restoreStockForOrder(o.orderid, client);

    // Đánh dấu hủy
    const upd = await client.query(
      `UPDATE productorders
          SET orderstatus='cancelled'
        WHERE orderid=$1
        RETURNING *`,
      [o.orderid]
    );

    await client.query("COMMIT");

    // ====== Notify + Email (sau COMMIT) ======
    try {
      await notifyUser(userId, "Đơn hàng đã hủy", `Đơn #${orderId} đã được hủy.`);

      const u = await pool.query(
        `SELECT username, email FROM users WHERE userid=$1`,
        [userId]
      );
      const user = u.rows[0];
      await sendOrderEmailCancelled(upd.rows[0], user);
    } catch (e) {
      console.warn("userCancel notify/email warn:", e?.message);
    }

    return res.json(upd.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("userCancel error:", err);
    return res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
}



/** Admin: list + filter + paging */
async function adminList(req, res) {
  try {
    const {
      q = "",
      status = "",
      payment = "",
      page = 1,
      limit = 20,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * pageSize;

    const where = [];
    const params = [];

    if (q) {
      params.push(`%${q}%`);
      where.push(`(
        CAST(po.orderid AS TEXT) ILIKE $${params.length}
        OR u.username ILIKE $${params.length}
        OR u.email ILIKE $${params.length}
      )`);
    }
    if (status) {
      params.push(String(status).toLowerCase());
      where.push(`LOWER(po.orderstatus) = $${params.length}`);
    }
    if (payment) {
      params.push(String(payment).toLowerCase());
      where.push(`LOWER(po.paymentstatus) = $${params.length}`);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const countSql = `
      SELECT COUNT(*)::INT AS total
        FROM productorders po
        JOIN users u ON u.userid = po.userid
      ${whereSql}
    `;
    const cnt = await pool.query(countSql, params);
    const total = cnt.rows[0]?.total || 0;

    params.push(pageSize, offset);
    const listSql = `
      SELECT po.*, u.username, u.email
        FROM productorders po
        JOIN users u ON u.userid = po.userid
      ${whereSql}
      ORDER BY po.orderid DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;
    const list = await pool.query(listSql, params);

    res.json({ items: list.rows, total, page: pageNum, limit: pageSize });
  } catch (err) {
    console.error("adminList error:", err);
    res.status(500).json({ message: "Server error" });
  }
}

/** Admin update trạng thái + optional tracking */
async function adminUpdateStatus(req, res) {
  try {
    const { id } = req.params;
    let {
      status,
      tracking_number = null,
      carrier = null,
      note = null,
    } = req.body;

    status = String(status || "")
      .toLowerCase()
      .trim();
    if (!ALLOWED_ADMIN_STATUS.has(status))
      return res.status(400).json({ message: "Invalid status" });

    const r = await pool.query(
      `SELECT orderid, userid, orderstatus, notes FROM productorders WHERE orderid=$1`,
      [id]
    );
    if (!r.rows.length)
      return res.status(404).json({ message: "Order not found" });

    const upd = await pool.query(
      `UPDATE productorders
          SET orderstatus=$1,
              notes = COALESCE($2, notes)
        WHERE orderid=$3
        RETURNING *`,
      [
        status,
        buildNoteTracked(r.rows[0].notes, note, carrier, tracking_number),
        id,
      ]
    );

    const userId = r.rows[0].userid;
    const readable = status[0].toUpperCase() + status.slice(1);
    let msg = `Đơn #${id} chuyển trạng thái: ${readable}.`;
    if (status === "shipped" && (tracking_number || carrier)) {
      msg += ` Vận chuyển: ${carrier || ""} ${tracking_number || ""}`.trim();
    }
    await notifyUser(userId, "Cập nhật đơn hàng", msg);

    res.json(upd.rows[0]);
  } catch (err) {
    console.error("adminUpdateStatus error:", err);
    res.status(500).json({ message: "Server error" });
  }
}

/** NEW: Admin xoá đơn hàng */
async function adminDelete(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: "Invalid id" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Xoá chi tiết đơn trước (an toàn với FK)
    await client.query(`DELETE FROM productorderdetails WHERE orderid=$1`, [
      id,
    ]);

    // Xoá đơn
    const del = await client.query(
      `DELETE FROM productorders WHERE orderid=$1 RETURNING orderid`,
      [id]
    );
    if (del.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Order not found" });
    }

    await client.query("COMMIT");
    return res.json({ ok: true, orderId: id });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("adminDelete order error:", err);
    return res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
}
/** User pay now (giả lập): chỉ cho phép khi unpaid + pending */


/** POST /api/orders/:id/pay — user thanh toán giả lập */
async function userPayNow(req, res) {
  try {
    const userId = req.user.userId;
    const id = Number(req.params.id);

    const r = await pool.query(
      `SELECT o.orderid, o.userid, o.orderstatus, o.paymentstatus, u.username, u.email
         FROM productorders o
         JOIN users u ON u.userid = o.userid
        WHERE o.orderid=$1`,
      [id]
    );
    if (!r.rows.length)
      return res.status(404).json({ message: "Order not found" });

    const o = r.rows[0];
    if (o.userid !== userId)
      return res.status(403).json({ message: "Forbidden" });
    if (o.paymentstatus !== "unpaid")
      return res.status(400).json({ message: "Order already paid/refunded" });
    if (o.orderstatus !== "pending")
      return res.status(400).json({ message: "Order is not pending" });

    const upd = await pool.query(
      `UPDATE productorders
          SET paymentstatus='paid', orderstatus='processing'
        WHERE orderid=$1
        RETURNING *`,
      [id]
    );
    // 🔔 Nếu đơn có sản phẩm membership -> kích hoạt gói
    try {
      await membership.activateFromPaidOrder({ orderId: id });
      // ⭐ FIX: Nếu đơn có sản phẩm là membership -> update user thành premium
      try {
        const check = await pool.query(
          `SELECT p.productid
     FROM productorderdetails d
     JOIN products p ON p.productid = d.productid
     WHERE d.orderid=$1 AND p.is_membership=true`,
          [id]
        );

        if (check.rows.length > 0) {
          await pool.query(
            `UPDATE users
         SET membershiptier='premium',
             update_at = NOW()
       WHERE userid=$1`,
            [userId]
          );
        }
      } catch (err) {
        console.error("[Membership upgrade error]:", err);
      }
    } catch (e) {
      console.warn(
        "activateFromPaidOrder via /orders/:id/pay warn:",
        e?.message
      );
    }

    await notifyUser(
      userId,
      "Thanh toán thành công",
      `Đơn #${id} đã được thanh toán.`
    );
    try {
      await sendOrderEmailPaid(
        { ...upd.rows[0] },
        { username: o.username, email: o.email }
      );
    } catch {}

    return res.json(upd.rows[0]);
  } catch (err) {
    console.error("userPayNow error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}


/** Export đầy đủ (giữ nguyên các hàm cũ + thêm hàm admin) */
module.exports = {
  ...ordersController,
  userCancel,
  adminList,
  adminUpdateStatus,
  adminDelete, // NEW
  userPayNow, // NEW
};
