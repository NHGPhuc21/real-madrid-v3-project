// backend/src/routes/notifications.js
const express = require("express");
const { authMiddleware } = require("../middleware/authmiddleware");
const pool = require("../../config/db");

const router = express.Router();

// List (mặc định mới nhất trước)
router.get("/", authMiddleware, async (req, res) => {
  const onlyUnread = String(req.query.unread || "") === "1";
  const r = await pool.query(
    `SELECT * FROM notifications
      WHERE userid=$1 ${onlyUnread ? "AND read_at IS NULL" : ""}
      ORDER BY id DESC
      LIMIT 50`,
    [req.user.userId]
  );
  res.json(r.rows);
});

// Đánh dấu đã đọc 1 cái
router.patch("/:id/read", authMiddleware, async (req, res) => {
  const { id } = req.params;
  await pool.query(
    `UPDATE notifications SET read_at=NOW()
     WHERE id=$1 AND userid=$2`,
    [id, req.user.userId]
  );
  res.json({ ok: true });
});

// Đánh dấu đã đọc tất cả
router.patch("/read-all", authMiddleware, async (req, res) => {
  await pool.query(
    `UPDATE notifications SET read_at=NOW() WHERE userid=$1 AND read_at IS NULL`,
    [req.user.userId]
  );
  res.json({ ok: true });
});

module.exports = router;
