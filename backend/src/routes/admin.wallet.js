// backend / src / routes / admin.wallet.js;

// backend/src/routes/admin.wallet.js
const express = require("express");
const { authMiddleware } = require("../middleware/authmiddleware");
const pool = require("../../config/db");
const wallet = require("../services/wallet");

const router = express.Router();

// guard admin
function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
}

// List + filter
router.get("/withdrawals", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { status = "", page = 1, limit = 20, q = "" } = req.query;
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const off = (p - 1) * l;

    const where = [];
    const args = [];

    if (status) {
      args.push(status.toLowerCase());
      where.push(`LOWER(w.status)=$${args.length}`);
    }
    if (q) {
      args.push(`%${q}%`);
      where.push(
        `(CAST(w.id AS TEXT) ILIKE $${args.length} OR CAST(w.userid AS TEXT) ILIKE $${args.length})`
      );
    }
    const ws = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const cnt = await pool.query(
      `SELECT COUNT(*)::int AS total FROM wallet_withdrawals w ${ws}`,
      args
    );

    args.push(l, off);
    const list = await pool.query(
      `
      SELECT w.*, u.username, u.email
        FROM wallet_withdrawals w
        JOIN users u ON u.userid=w.userid
      ${ws}
      ORDER BY w.id DESC
      LIMIT $${args.length - 1} OFFSET $${args.length}
    `,
      args
    );

    res.json({ items: list.rows, total: cnt.rows[0].total, page: p, limit: l });
  } catch (e) {
    console.error("withdrawals list error", e);
    res.status(500).json({ message: "Server error" });
  }
});

// Update trạng thái (approve/processing/rejected)
router.patch(
  "/withdrawals/:id/status",
  authMiddleware,
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { status, admin_note = null } = req.body || {};
      const allowed = new Set(["approved", "processing", "rejected"]);
      if (!allowed.has(String(status || "").toLowerCase())) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const r = await pool.query(
        `UPDATE wallet_withdrawals
          SET status=$1, admin_note=COALESCE($2, admin_note), updated_at=NOW()
        WHERE id=$3
        RETURNING *`,
        [status, admin_note, id]
      );

      if (!r.rows.length) return res.status(404).json({ message: "Not found" });
      res.json(r.rows[0]);
    } catch (e) {
      console.error("withdrawals update status error", e);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Complete (ghi sổ kế toán)
router.post(
  "/withdrawals/:id/complete",
  authMiddleware,
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const r = await wallet.withdrawComplete({
        adminUserId: req.user.userId,
        withdrawalId: id,
      });
      res.json(r);
    } catch (e) {
      console.error("withdrawals complete error", e);
      const map = {
        WITHDRAW_NOT_FOUND: 404,
        WITHDRAW_BAD_STATE: 400,
        WALLET_NOT_FOUND: 500,
        CLEARING_NOT_SET: 500,
        CLEARING_WALLET_NOT_FOUND: 500,
        BALANCE_NOT_FOUND: 500,
      };
      res
        .status(map[e.message] || 500)
        .json({ message: e.message || "Server error" });
    }
  }
);

module.exports = router;
