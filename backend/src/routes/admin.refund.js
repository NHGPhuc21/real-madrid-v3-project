// backend/src/routes/admin.refund.js
const express = require("express");
const { authMiddleware } = require("../middleware/authmiddleware");
const wallet = require("../services/wallet");

const router = express.Router();

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin")
    return res.status(403).json({ message: "Forbidden" });
  next();
}

/** Refund một đơn hàng đã thanh toán (wallet) */
router.post(
  "/orders/:id/refund",
  authMiddleware,
  requireAdmin,
  async (req, res) => {
    try {
      const orderId = Number(req.params.id);
      const { amount, reason } = req.body || {};
      const r = await wallet.refundOrder({
        adminUserId: req.user.userId,
        orderId,
        amount,
        reason: reason || "admin_refund",
      });
      res.json(r);
    } catch (e) {
      const map = {
        ORDER_NOT_FOUND: 404,
        ORDER_NOT_PAID: 400,
        AMOUNT_TOO_LARGE: 400,
        WALLET_NOT_FOUND: 500,
        MERCHANT_WALLET_NOT_FOUND: 500,
        BALANCE_NOT_FOUND: 500,
        MERCHANT_FUNDS_NOT_ENOUGH: 400,
      };
      res
        .status(map[e.message] || 500)
        .json({ message: e.message || "Server error" });
    }
  }
);

module.exports = router;
