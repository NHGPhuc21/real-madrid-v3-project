const express = require("express");
const router = express.Router();
const pool = require("../../config/db");
const { authMiddleware } = require("../middleware/authmiddleware");

/**
 * USER — Freeze money
 * Body: { amount, reason }
 */
router.post("/freeze", authMiddleware, async (req, res) => {
  try {
    const userid = req.user.userid;
    const { amount, reason } = req.body;

    if (!amount || amount <= 0)
      return res.status(400).json({ message: "INVALID_AMOUNT" });

    // Lấy wallet_id
    const w = await pool.query(
      `SELECT id FROM wallet_accounts WHERE userid=$1`,
      [userid]
    );
    if (w.rowCount === 0)
      return res.status(404).json({ message: "WALLET_NOT_FOUND" });

    const walletId = w.rows[0].id;

    // Check số dư
    const bal = await pool.query(
      `SELECT available FROM wallet_balances WHERE walletid=$1`,
      [walletId]
    );

    if (Number(bal.rows[0].available) < amount) {
      return res.status(400).json({ message: "NOT_ENOUGH_BALANCE" });
    }

    // 1) Giảm balance — Tăng freeze
    const updated = await pool.query(
      `
      UPDATE wallet_balances
      SET 
        available = available - $2,
        frozen = frozen + $2,
        updated_at = NOW()
      WHERE walletid = $1
      RETURNING *
      `,
      [walletId, amount]
    );

    // 2) Ghi log freeze
    await pool.query(
      `
      INSERT INTO wallet_freeze(walletid, amount, reason, expire_at)
      VALUES ($1, $2, $3, NOW() + interval '30 minutes')
      `,
      [walletId, amount, reason || "manual_freeze"]
    );

    return res.json({
      message: "FROZEN_OK",
      freeze_amount: amount,
      balance_after: updated.rows[0],
    });
  } catch (err) {
    console.error("[Wallet Freeze] error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
