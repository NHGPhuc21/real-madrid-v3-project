// backend/src/routes/admin.reconcile.js
const express = require("express");
const { authMiddleware } = require("../middleware/authmiddleware");
const payments = require("../services/payments");

const router = express.Router();

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin")
    return res.status(403).json({ message: "Forbidden" });
  next();
}

router.post(
  "/reconcile/run",
  authMiddleware,
  requireAdmin,
  async (req, res) => {
    try {
      const r = await payments.expirePendingSessionsAndRelease();
      res.json({ ok: true, ...r });
    } catch (e) {
      res.status(500).json({ message: e.message || "Server error" });
    }
  }
);

module.exports = router;
