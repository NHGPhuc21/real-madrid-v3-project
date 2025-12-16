// backend/src/controllers/ticketorderscontroller.js
const pool = require("../../config/db");
const { randomUUID } = require("crypto");
const wallet = require("../services/wallet"); // dùng ví cho thanh toán
const MERCHANT_USER_ID = Number(process.env.MERCHANT_USER_ID || 1);
const membership = require("../services/membership");
// =============================
// 1. Tạo đơn vé (chưa thanh toán)
// =============================
exports.quickBuy = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { matchId, categoryId, quantity = 1 } = req.body || {};

    const qty = Number(quantity) || 1;
    if (!matchId || qty <= 0) {
      return res.status(400).json({ message: "Missing matchId or quantity" });
    }

    // Lấy 1 loại vé cho trận này
    let sql = `
      SELECT t.ticketid, t.matchid, t.categoryid, t.availablequantity,
             tc.price, tc.categoryname,
             m.opponentteam, m.matchdatetime, m.stadium, m.competition
      FROM tickets t
      JOIN ticketcategories tc ON t.categoryid = tc.categoryid
      JOIN matches m ON t.matchid = m.matchid
      WHERE t.matchid = $1
    `;
    const params = [matchId];

    if (categoryId) {
      sql += " AND t.categoryid = $2 ORDER BY tc.price ASC LIMIT 1";
      params.push(categoryId);
    } else {
      sql += " ORDER BY tc.price ASC LIMIT 1";
    }

    const tR = await pool.query(sql, params);
    if (!tR.rows.length) {
      return res.status(404).json({ message: "No tickets for this match" });
    }
    const ticket = tR.rows[0];

    if (ticket.availablequantity < qty) {
      return res.status(400).json({
        message: `Not enough tickets. Available: ${ticket.availablequantity}`,
      });
    }

    // 🔹 Kiểm tra membership hiện tại của user
    let discountPercent = 0;
    try {
      const mem = await membership.getCurrentMembership({ userId });
      // nếu đang dùng Premium thì giảm 10%
      if (mem && String(mem.plan_code).toLowerCase() === "premium") {
        discountPercent = 10;
      }
    } catch (e) {
      console.warn("quickBuy membership warn:", e.message);
    }

    const baseUnitPrice = Number(ticket.price); // giá gốc
    let unitPrice = baseUnitPrice;

    if (discountPercent > 0) {
      // áp dụng giảm, làm tròn 2 chữ số cho khớp numeric(10,2)
      unitPrice = Math.round(baseUnitPrice * (100 - discountPercent)) / 100;
    }

    const subtotal = unitPrice * qty;

    // Tạo order + detail (CHƯA sinh QR, CHƯA thanh toán)
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const oIns = await client.query(
        `INSERT INTO ticketorders(userid, totalamount, orderstatus, paymentmethod, paymentstatus)
         VALUES($1,$2,'pending',NULL,'unpaid')
         RETURNING orderid, orderdate, orderstatus, paymentstatus, totalamount`,
        [userId, subtotal]
      );
      const order = oIns.rows[0];

      await client.query(
        `INSERT INTO ticketorderdetails(orderid, ticketid, quantity, unitprice, subtotal, qrcodeurl)
         VALUES($1,$2,$3,$4,$5,NULL)
         RETURNING detailid`,
        [order.orderid, ticket.ticketid, qty, unitPrice, subtotal]
      );

      // Trigger ở DB sẽ tự trừ AvailableQuantity
      await client.query("COMMIT");

      return res.status(201).json({
        orderid: order.orderid,
        orderdate: order.orderdate,
        orderstatus: order.orderstatus,
        paymentstatus: order.paymentstatus,
        totalamount: order.totalamount,
        items: [
          {
            ticketid: ticket.ticketid,
            quantity: qty,
            unitprice: unitPrice,
            subtotal,
            categoryname: ticket.categoryname,
            opponentteam: ticket.opponentteam,
            matchdatetime: ticket.matchdatetime,
          },
        ],
      });
    } catch (e) {
      await client.query("ROLLBACK");
      console.error("quickBuy error:", e);
      return res.status(500).json({ message: "Server error" });
    } finally {
      client.release();
    }
  } catch (e) {
    console.error("quickBuy outer error:", e);
    return res.status(500).json({ message: "Server error" });
  }
};

// ==========================================
// 2. Lấy danh sách tất cả ticket orders của user
//    (dùng cho MyTickets.vue như cũ)
// ==========================================
// ==========================================
// 2. Lấy danh sách tất cả ticket orders của user
//    (dùng cho MyTickets.vue như cũ)
// ==========================================
exports.getMyTickets = async (req, res) => {
  try {
    const userId = req.user.userId;
    const r = await pool.query(
      `
      SELECT
        o.orderid,
        o.orderdate,
        o.orderstatus,
        o.paymentstatus,
        o.totalamount,
        d.ticketid,
        d.quantity,
        d.unitprice,
        d.subtotal,
        d.qrcodeurl AS qrcode,
        m.opponentteam,
        m.matchdatetime,
        tc.categoryname
      FROM ticketorders o
      JOIN ticketorderdetails d ON d.orderid = o.orderid
      JOIN tickets t ON t.ticketid = d.ticketid
      JOIN matches m ON m.matchid = t.matchid
      JOIN ticketcategories tc ON tc.categoryid = t.categoryid
      WHERE o.userid = $1
        AND o.paymentstatus = 'paid'        -- 🔴 CHỈ LẤY ĐƠN ĐÃ THANH TOÁN
      ORDER BY o.orderdate DESC, o.orderid DESC
    `,
      [userId]
    );
    res.json(r.rows);
  } catch (e) {
    console.error("getMyTickets error:", e);
    res.status(500).json({ message: "Server error" });
  }
};


// ==========================================
// 3. Lấy chi tiết 1 ticket order (cho TicketOrderDetail.vue)
// ==========================================
exports.getTicketOrderDetail = async (req, res) => {
  try {
    const userId = req.user.userId;
    const orderId = Number(req.params.id);

    const r = await pool.query(
      `
      SELECT
        o.orderid,
        o.userid,
        o.orderdate,
        o.orderstatus,
        o.paymentstatus,
        o.totalamount,
        d.ticketid,
        d.quantity,
        d.unitprice,
        d.subtotal,
        d.qrcodeurl AS qrcode,
        m.opponentteam,
        m.matchdatetime,
        tc.categoryname,
        m.stadium,
        m.competition
      FROM ticketorders o
      JOIN ticketorderdetails d ON d.orderid = o.orderid
      JOIN tickets t ON t.ticketid = d.ticketid
      JOIN matches m ON m.matchid = t.matchid
      JOIN ticketcategories tc ON tc.categoryid = t.categoryid
      WHERE o.orderid = $1
      ORDER BY d.detailid ASC
    `,
      [orderId]
    );

    if (!r.rows.length) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (r.rows[0].userid !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.json(r.rows);
  } catch (e) {
    console.error("getTicketOrderDetail error:", e);
    res.status(500).json({ message: "Server error" });
  }
};

// ==========================================
// 4. Thanh toán ticket order bằng ví + PIN
// ==========================================
// ==========================================
// 4. Thanh toán ticket order bằng ví + PIN
// ==========================================
exports.payWithWallet = async (req, res) => {
  try {
    const userId = req.user.userId;
    const orderId = Number(req.params.id);
    const { pin } = req.body || {};

    if (!pin) {
      return res.status(400).json({ message: "PIN is required" });
    }

    // Lấy order
    const oR = await pool.query(
      `SELECT orderid, userid, totalamount, orderstatus, paymentstatus
         FROM ticketorders
        WHERE orderid = $1`,
      [orderId]
    );
    if (!oR.rows.length) {
      return res.status(404).json({ message: "Order not found" });
    }
    const order = oR.rows[0];
    if (order.userid !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (order.paymentstatus === "paid") {
      return res.status(400).json({ message: "Order already paid" });
    }
    if (order.orderstatus !== "pending") {
      return res.status(400).json({ message: "Order is not payable" });
    }

    // ===== 1. Check PIN + xem user có ví chưa (giống logic /wallet/charge) =====
    let okPin;
    try {
      okPin = await wallet.verifyPin({ userId, pin });
    } catch (e) {
      console.error("wallet.verifyPin error:", e);
      const map = {
        WALLET_NOT_FOUND: 404,
        BALANCE_NOT_FOUND: 404,
        PIN_NOT_SET: 400,
        INVALID_PIN: 400,
      };
      const code = map[e.message] || 500;
      // trả thẳng e.message để FE hiển thị giống bên shop
      return res.status(code).json({ message: e.message });
    }
    if (!okPin) {
      return res.status(400).json({ message: "PIN_INCORRECT" });
    }

    const amount = Number(order.totalamount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: "Invalid order amount" });
    }

    // ===== 2. Chuyển tiền ví: user -> merchant =====
    const idemKey = `ticketpay:${orderId}:${userId}`;
    try {
      await wallet.transfer({
        fromUserId: userId,
        toUserId: MERCHANT_USER_ID,
        amount,
        reason: "ticket_order",
        idempotencyKey: idemKey,
      });
    } catch (e) {
      console.error("wallet.transfer ticket error:", e);
      const map = {
        INVALID_AMOUNT: 400,
        SAME_WALLET: 400,
        WALLET_NOT_FOUND: 404,
        BALANCE_NOT_FOUND: 404,
        INSUFFICIENT_FUNDS: 400,
        IDEMPOTENT_REPLAY: 409,
      };
      const code = map[e.message] || 500;
      // cũng trả thẳng e.message -> BALANCE_NOT_FOUND, WALLET_NOT_FOUND...
      return res.status(code).json({ message: e.message });
    }

    // ===== 3. Sau khi chuyển tiền ok -> cập nhật order + sinh QR =====
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        `UPDATE ticketorders
            SET paymentstatus='paid',
                orderstatus='confirmed',
                paymentmethod='wallet'
          WHERE orderid=$1`,
        [orderId]
      );

      const dR = await client.query(
        `SELECT detailid, qrcodeurl
           FROM ticketorderdetails
          WHERE orderid=$1`,
        [orderId]
      );
      for (const row of dR.rows) {
        if (!row.qrcodeurl) {
          const code = randomUUID();
          await client.query(
            `UPDATE ticketorderdetails
                SET qrcodeurl=$1
              WHERE detailid=$2`,
            [code, row.detailid]
          );
        }
      }

      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      console.error("payWithWallet update error:", e);
      return res.status(500).json({ message: "Server error" });
    } finally {
      client.release();
    }

    // ===== 4. Trả lại chi tiết mới nhất =====
    const r = await pool.query(
      `
      SELECT
        o.orderid,
        o.userid,
        o.orderdate,
        o.orderstatus,
        o.paymentstatus,
        o.totalamount,
        d.ticketid,
        d.quantity,
        d.unitprice,
        d.subtotal,
        d.qrcodeurl AS qrcode,
        m.opponentteam,
        m.matchdatetime,
        tc.categoryname,
        m.stadium,
        m.competition
      FROM ticketorders o
      JOIN ticketorderdetails d ON d.orderid = o.orderid
      JOIN tickets t ON t.ticketid = d.ticketid
      JOIN matches m ON m.matchid = t.matchid
      JOIN ticketcategories tc ON tc.categoryid = t.categoryid
      WHERE o.orderid = $1
      ORDER BY d.detailid ASC
    `,
      [orderId]
    );

    return res.json(r.rows);
  } catch (e) {
    console.error("payWithWallet outer error:", e);
    res.status(500).json({ message: "Server error" });
  }
};

