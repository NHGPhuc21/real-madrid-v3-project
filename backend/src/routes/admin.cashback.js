// backend/src/routes/admin.cashback.js
const express = require("express");
const { authMiddleware } = require("../middleware/authmiddleware");
const pool = require("../../config/db");
const router = express.Router();
function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin")
    return res.status(403).json({ message: "Forbidden" });
  next();
}

// List
router.get(
  "/cashback-rules",
  authMiddleware,
  requireAdmin,
  async (req, res) => {
    const r = await pool.query(`SELECT * FROM cashback_rules ORDER BY id DESC`);
    res.json(r.rows);
  }
);

// Create
router.post(
  "/cashback-rules",
  authMiddleware,
  requireAdmin,
  async (req, res) => {
    const { name, percent, max_amount = null, active = true } = req.body || {};
    if (!name || !Number.isFinite(Number(percent)))
      return res.status(400).json({ message: "Invalid payload" });
    const r = await pool.query(
      `INSERT INTO cashback_rules(name,percent,max_amount,active) VALUES($1,$2,$3,$4) RETURNING *`,
      [
        name,
        Number(percent),
        max_amount == null ? null : Number(max_amount),
        !!active,
      ]
    );
    res.status(201).json(r.rows[0]);
  }
);

// Update
router.patch(
  "/cashback-rules/:id",
  authMiddleware,
  requireAdmin,
  async (req, res) => {
    const id = Number(req.params.id);
    const { name, percent, max_amount, active } = req.body || {};
    const r = await pool.query(
      `UPDATE cashback_rules
        SET name=COALESCE($1,name),
            percent=COALESCE($2,percent),
            max_amount=$3,
            active=COALESCE($4,active)
      WHERE id=$5 RETURNING *`,
      [
        name ?? null,
        percent != null ? Number(percent) : null,
        max_amount === undefined
          ? null
          : max_amount == null
          ? null
          : Number(max_amount),
        active === undefined ? null : !!active,
        id,
      ]
    );
    if (!r.rows.length) return res.status(404).json({ message: "Not found" });
    res.json(r.rows[0]);
  }
);

// Delete
router.delete(
  "/cashback-rules/:id",
  authMiddleware,
  requireAdmin,
  async (req, res) => {
    const id = Number(req.params.id);
    const r = await pool.query(
      `DELETE FROM cashback_rules WHERE id=$1 RETURNING id`,
      [id]
    );
    if (!r.rows.length) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true });
  }
);

module.exports = router;
