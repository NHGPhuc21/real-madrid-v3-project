const express = require("express");
const pool = require("../../config/db");
const { authMiddleware } = require("../middleware/authmiddleware");
const { sendOrderEmailRefunded } = require("../lib/mailer");

const router = express.Router();

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin")
    return res.status(403).json({ message: "Forbidden" });
  next();
}

async function ensureWallet(client, userId) {
  const r = await client.query(`SELECT id FROM wallets WHERE userid=$1`, [
    userId,
  ]);
  if (r.rows.length) return r.rows[0].id;
  const ins = await client.query(
    `INSERT INTO wallets(userid, balance) VALUES($1, 0) RETURNING id`,
    [userId]
  );
  return ins.rows[0].id;
}

router.post(
  "/admin/orders/:id/refund",
  authMiddleware,
  requireAdmin,
  async (req, res) => {
    const id = Number(req.params.id);
    const amount = Number(req.body?.amount || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const orr = await client.query(
        `SELECT o.*, u.username, u.email
         FROM productorders o
         JOIN users u ON u.userid = o.userid
        WHERE o.orderid=$1
        FOR UPDATE`,
        [id]
      );
      if (!orr.rows.length) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "Order not found" });
      }
      const order = orr.rows[0];
      if (order.paymentstatus !== "paid") {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "Order is not paid" });
      }
      // hạn mức: không hoàn quá tổng tiền
      if (amount > Number(order.totalamount)) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "Amount exceeds order total" });
      }

      const walletId = await ensureWallet(client, order.userid);

      // Ghi credit vào ví
      await client.query(
        `INSERT INTO wallet_transactions (walletid, type, amount, reference, meta)
       VALUES($1, 'credit', $2, $3, json_build_object('orderid',$4,'reason',$5))`,
        [walletId, amount, `REFUND#${id}`, id, req.body?.reason || null]
      );
      await client.query(
        `UPDATE wallets SET balance = balance + $1 WHERE id=$2`,
        [amount, walletId]
      );

      // Cập nhật đơn
      const upd = await client.query(
        `UPDATE productorders
          SET paymentstatus='refunded',
              orderstatus='cancelled',
              notes = COALESCE(notes,'') || '\n[refund '|| $2 ||']'
        WHERE orderid=$1
        RETURNING *`,
        [id, amount]
      );

      await client.query("COMMIT");

      // In-app notification
      await pool.query(
        `INSERT INTO notifications(userid, title, message)
       VALUES($1,$2,$3)`,
        [
          order.userid,
          "Hoàn tiền đơn hàng",
          `Đã hoàn ${amount} đ cho đơn #${id}.`,
        ]
      );

      // Email
      try {
        await sendOrderEmailRefunded(
          { ...upd.rows[0], refund_amount: amount },
          { username: order.username, email: order.email }
        );
      } catch {}

      return res.json({ ok: true, order: upd.rows[0] });
    } catch (e) {
      await client.query("ROLLBACK");
      console.error("admin refund error:", e);
      const map = { WALLET_NOT_FOUND: 404 };
      return res
        .status(map[e.message] || 500)
        .json({ message: e.message || "Server error" });
    } finally {
      client.release();
    }
  }
);

module.exports = router;
