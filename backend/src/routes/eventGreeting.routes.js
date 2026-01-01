const express = require("express");
const router = express.Router();
const pool = require("../../config/db");

/**
 * ⚠️ QUAN TRỌNG:
 * uploadMulter export object { upload, ... }
 * → phải destructuring
 */
const { upload } = require("../middleware/uploadMulter");
const { authMiddleware, adminOnly } = require("../middleware/authmiddleware");

/**
 * ==========================================
 * GET ALL GREETINGS OF AN EVENT (ADMIN)
 * ==========================================
 * GET /api/events/:key/greetings
 */
router.get("/:key/greetings", async (req, res) => {
  const { key } = req.params;

  try {
    const { rows } = await pool.query(
      `
      SELECT id, message, weight, enabled, created_at
      FROM event_greetings
      WHERE event_key = $1
      ORDER BY created_at DESC
      `,
      [key]
    );

    res.json(rows);
  } catch (err) {
    console.error("GET greetings error:", err.message);
    res.status(500).json({ message: "Failed to load greetings" });
  }
});

/**
 * ==========================================
 * 🎄 UPLOAD CHRISTMAS MUSIC (ADMIN)
 * ==========================================
 * POST /api/events/admin/christmas/music
 */
router.post(
  "/admin/christmas/music",
  authMiddleware,
  adminOnly,
  upload.single("music"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No music file uploaded" });
      }

      const musicUrl = `/uploads/events/christmas/${req.file.filename}`;

      await pool.query(
        `
        UPDATE events
        SET
          music_url = $1,
          music_enabled = true
        WHERE key = 'christmas'
        `,
        [musicUrl]
      );

      res.json({
        message: "Christmas music uploaded successfully",
        music_url: musicUrl,
      });
    } catch (err) {
      console.error("UPLOAD christmas music error:", err.message);
      res.status(500).json({ message: "Upload failed" });
    }
  }
);

/**
 * ==========================================
 * ADD GREETING (ADMIN)
 * ==========================================
 * POST /api/events/:key/greetings
 */
router.post("/:key/greetings", async (req, res) => {
  const { key } = req.params;
  const { message, weight = 1 } = req.body;

  if (weight < 0 || weight > 100) {
    return res
      .status(400)
      .json({ message: "Weight must be between 0 and 100 (%)" });
  }

  if (!message || !message.trim()) {
    return res.status(400).json({ message: "Message is required" });
  }

  try {
    const { rows } = await pool.query(
      `
      INSERT INTO event_greetings (event_key, message, weight)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [key, message.trim(), weight]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("POST greeting error:", err.message);
    res.status(500).json({ message: "Failed to add greeting" });
  }
});

/**
 * ==========================================
 * UPDATE GREETING (ADMIN)
 * ==========================================
 * PUT /api/events/greetings/:id
 */
router.put("/greetings/:id", async (req, res) => {
  const { id } = req.params;
  const { message, weight, enabled } = req.body;

  if (weight != null && (weight < 0 || weight > 100)) {
    return res
      .status(400)
      .json({ message: "Weight must be between 0 and 100 (%)" });
  }

  try {
    const { rows } = await pool.query(
      `
      UPDATE event_greetings
      SET
        message = COALESCE($1, message),
        weight  = COALESCE($2, weight),
        enabled = COALESCE($3, enabled)
      WHERE id = $4
      RETURNING *
      `,
      [message, weight, enabled, id]
    );

    res.json(rows[0] || null);
  } catch (err) {
    console.error("PUT greeting error:", err.message);
    res.status(500).json({ message: "Failed to update greeting" });
  }
});

/**
 * ==========================================
 * DELETE GREETING (ADMIN)
 * ==========================================
 * DELETE /api/events/greetings/:id
 */
router.delete("/greetings/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(`DELETE FROM event_greetings WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE greeting error:", err.message);
    res.status(500).json({ message: "Failed to delete greeting" });
  }
});

/**
 * ==========================================
 * RANDOM GREETING (USER / ADMIN)
 * ==========================================
 * GET /api/events/:key/random-greeting
 */
router.get("/:key/random-greeting", async (req, res) => {
  const { key } = req.params;

  try {
    const { rows } = await pool.query(
      `
      SELECT message, weight
      FROM event_greetings
      WHERE event_key = $1 AND enabled = true
      `,
      [key]
    );

    if (!rows.length) return res.json(null);

    const total = rows.reduce((sum, g) => sum + g.weight, 0);
    if (total <= 0) return res.json(null);

    const r = Math.random() * 100;
    let acc = 0;

    for (const g of rows) {
      acc += g.weight;
      if (r <= acc) return res.json({ message: g.message });
    }

    res.json({ message: rows[rows.length - 1].message });
  } catch (err) {
    console.error("RANDOM greeting error:", err.message);
    res.status(500).json({ message: "Failed to random greeting" });
  }
});

module.exports = router;
