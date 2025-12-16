// backend/src/services/membership.js
const pool = require("../../config/db");

/** Lấy plan theo code */
async function getPlanByCode(code, client = pool) {
  const r = await client.query(
    `SELECT * FROM membership_plans WHERE code=$1 AND active=true`,
    [code]
  );
  return r.rows[0] || null;
}

/** Lấy membership hiện tại của user (bản active mới nhất) */
async function getCurrentMembership({ userId }, client = pool) {
  const r = await client.query(
    `SELECT * FROM user_memberships
     WHERE userid=$1 AND status='active'
     ORDER BY started_at DESC
     LIMIT 1`,
    [userId]
  );
  return r.rows[0] || null;
}

/** Gán Basic khi đăng ký (idempotent: nếu đã có active -> bỏ qua) */
async function ensureBasicOnRegister({ userId }, client = pool) {
  const existing = await getCurrentMembership({ userId }, client);
  if (existing) return existing;

  const basic = await getPlanByCode("basic", client);
  if (!basic) return null;

  const ins = await client.query(
    `INSERT INTO user_memberships(userid, plan_code, started_at, expires_at, status, source_orderid, meta)
     VALUES($1, 'basic', NOW(), NULL, 'active', NULL, '{"source":"register"}')
     RETURNING *`,
    [userId]
  );
  return ins.rows[0];
}

/** Tìm product đại diện cho Premium */
async function getPremiumProductId(client = pool) {
  const r = await client.query(
    `SELECT productid, price FROM products
     WHERE is_membership=true AND LOWER(productname) LIKE '%premium%' 
     ORDER BY productid ASC LIMIT 1`
  );
  return r.rows[0] || null;
}

/** Kích hoạt membership từ một order đã paid:
 * - Nếu order có line is_membership=true ⇒ kích hoạt Premium duration theo plan.
 */

/** Kích hoạt membership từ một order đã paid */
async function activateFromPaidOrder({ orderId }, clientOuter = null) {
  const client = clientOuter || (await pool.connect());
  let ownTx = false;

  try {
    if (!clientOuter) {
      await client.query("BEGIN");
      ownTx = true;
    }

    // 1) Kiểm tra đơn có sản phẩm is_membership hay không
    const itemsR = await client.query(
      `SELECT d.productid, d.quantity, p.is_membership, p.productname
         FROM productorderdetails d
         JOIN products p ON p.productid = d.productid
        WHERE d.orderid = $1`,
      [orderId]
    );
    const PREMIUM_PRODUCT_IDS = [13, 14]; // sửa theo DB bạn

    const hasMembership = itemsR.rows.some((x) =>
      PREMIUM_PRODUCT_IDS.includes(Number(x.productid))
    );

    if (!hasMembership) {
      if (ownTx) await client.query("COMMIT");
      return { activated: false, reason: "NO_MEMBERSHIP_ITEM" };
    }

    // 2) Lấy thông tin order
    const oR = await client.query(
      `SELECT orderid, userid, paymentstatus 
         FROM productorders 
        WHERE orderid = $1`,
      [orderId]
    );
    if (!oR.rows.length) throw new Error("ORDER_NOT_FOUND");
    const ord = oR.rows[0];

    if (ord.paymentstatus !== "paid") {
      if (ownTx) await client.query("COMMIT");
      return { activated: false, reason: "ORDER_NOT_PAID_YET" };
    }

    // 3) Lấy plan Premium
    const plan = await getPlanByCode("premium", client);
    if (!plan) throw new Error("PLAN_PREMIUM_NOT_FOUND");
    const durationMonths = Number(plan.duration_months || 12);

    // 4) Đánh dấu Basic cũ là expired (nếu có)
    await client.query(
      `UPDATE user_memberships
          SET status = 'expired', expires_at = NOW()
        WHERE userid = $1 AND status = 'active' AND plan_code <> 'premium'`,
      [ord.userid]
    );

    // 5) Nếu đã có Premium active thì cộng dồn thêm thời gian
    const curR = await client.query(
      `SELECT * FROM user_memberships
        WHERE userid=$1 AND status='active' AND plan_code='premium'
        ORDER BY started_at DESC
        LIMIT 1`,
      [ord.userid]
    );

    let baseDate;
    if (curR.rows.length) {
      // gia hạn từ ngày hết hạn hiện tại
      baseDate = curR.rows[0].expires_at || new Date();
    } else {
      // nâng cấp lần đầu -> tính từ bây giờ
      baseDate = new Date();
    }

    const expiresAt = new Date(baseDate);
    // + durationMonths tháng
    expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

    // 6) Tạo bản ghi Premium mới
    const ins = await client.query(
      `INSERT INTO user_memberships
         (userid, plan_code, started_at, expires_at, status, source_orderid, meta)
       VALUES ($1, 'premium', NOW(), $2, 'active', $3, '{"source":"order"}')
       RETURNING *`,
      [ord.userid, expiresAt, orderId]
    );
    await client.query(
      `UPDATE users SET membershiptier='premium' WHERE userid=$1`,
      [ord.userid]
    );

    if (ownTx) await client.query("COMMIT");
    console.log(
      "[membership] Activated premium for user",
      ord.userid,
      "order",
      orderId
    );
    return { activated: true, membership: ins.rows[0] };
  } catch (e) {
    if (ownTx) {
      await client.query("ROLLBACK").catch(() => {});
    }
    console.error("activateFromPaidOrder error:", e);
    throw e;
  } finally {
    if (!clientOuter) client.release();
  }
}


/** Tạo order membership (không cần cart) và trả về orderId */
async function createPremiumOrder({ userId }, client = pool) {
  // lấy product premium
  const p = await getPremiumProductId(client);
  if (!p) throw new Error("MEMBERSHIP_PRODUCT_NOT_FOUND");

  // tạo đơn tối giản như Shop: 1 item, no shipping
  const insO = await client.query(
    `INSERT INTO productorders
      (userid, totalamount, shippingaddress, shippingfee, orderstatus, paymentmethod, paymentstatus, notes)
     VALUES ($1, $2, NULL, 0, 'pending', NULL, 'unpaid', 'membership_upgrade')
     RETURNING orderid`,
    [userId, p.price]
  );
  const orderId = insO.rows[0].orderid;

  await client.query(
    `INSERT INTO productorderdetails(orderid, productid, optionid, quantity, unitprice, subtotal)
     VALUES ($1, $2, NULL, 1, $3, $3)`,
    [orderId, p.productid, p.price]
  );
  return { orderId, amount: p.price };
}

module.exports = {
  getPlanByCode,
  getCurrentMembership,
  ensureBasicOnRegister,
  activateFromPaidOrder,
  createPremiumOrder,
};
