// backend/src/routes/wallet.admin.js
const express = require("express");
const { authMiddleware, adminOnly } = require("../middleware/authmiddleware");
const pool = require("../../config/db");

const router = express.Router();

/**
 * ADMIN — Lấy danh sách ví
 */
router.get("/", authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.userid,
        u.fullname,
        u.email,

        wa.id AS walletid,
        COALESCE(wb.available, 0) AS balance,
        COALESCE(wb.frozen, 0) AS freeze_balance,
        wa.status AS wallet_status

      FROM wallet_accounts wa
      JOIN users u ON u.userid = wa.userid
      LEFT JOIN wallet_balances wb ON wb.walletid = wa.id
      
      ORDER BY u.fullname ASC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("[Admin Wallet] GET /wallet/admin error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * ADMIN — Unfreeze: hoàn số tiền freeze về balance
 */
router.put("/unfreeze/:userid", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { userid } = req.params;

    // 1) Lấy wallet_id
    const w = await pool.query(
      `SELECT id FROM wallet_accounts WHERE userid = $1`,
      [userid]
    );

    if (w.rowCount === 0)
      return res.status(404).json({ message: "WALLET_NOT_FOUND" });

    const walletId = w.rows[0].id;

    // 2) Lấy số tiền đang freeze
    const bal = await pool.query(
      `SELECT frozen FROM wallet_balances WHERE walletid = $1`,
      [walletId]
    );

    const frozen = Number(bal.rows[0].frozen || 0);

    if (frozen <= 0) {
      return res.json({ message: "Nothing to unfreeze", walletId });
    }

    // 3) Hoàn lại tiền: freeze → balance
    const updated = await pool.query(
      `
      UPDATE wallet_balances
      SET 
        available = available + $2,  -- hoàn về ví
        frozen = 0,
        updated_at = NOW()
      WHERE walletid = $1
      RETURNING *
    `,
      [walletId, frozen]
    );

    // 4) Đánh dấu released trong bảng freeze log
    await pool.query(
      `UPDATE wallet_freeze SET released_at = NOW() 
       WHERE walletid = $1 AND released_at IS NULL`,
      [walletId]
    );

    res.json({
      message: "Unfreeze completed",
      restored_amount: frozen,
      balance_after: updated.rows[0],
    });
  } catch (err) {
    console.error("[Admin Wallet] PUT /unfreeze error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
