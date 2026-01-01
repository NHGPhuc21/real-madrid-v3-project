const express = require("express");
const router = express.Router();
const pool = require("../../config/db");

/**
 * ==========================================
 * GET ACTIVE EVENT
 * Trả về event đang enabled (hoặc null)
 * MỞ RỘNG: trả thêm music_enabled + music_url
 * ==========================================
 * GET /api/events/active
 */
router.get("/active", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `
      SELECT
        id,
        key,
        enabled,
        config,
        music_enabled,
        music_url
      FROM events
      WHERE enabled = true
      LIMIT 1
      `
    );

    if (!rows.length) {
      return res.json(null);
    }

    const event = rows[0];

    res.json({
      key: event.key,
      enabled: event.enabled,
      config: event.config || {},

      // 🎵 Christmas music (frontend sẽ tự dùng khi key === "christmas")
      music_enabled: event.music_enabled || false,
      music_url: event.music_url || null,
    });
  } catch (err) {
    console.error("GET /events/active error:", err.message);
    res.status(500).json({ message: "Failed to load active event" });
  }
});

/**
 * ==========================================
 * ENABLE ONE EVENT (ADMIN)
 * - Disable tất cả
 * - Enable event theo key
 * - Với christmas: nhận greeting từ body và lưu vào config
 * ==========================================
 * PUT /api/events/:key/enable
 */
router.put("/:key/enable", async (req, res) => {
  const { key } = req.params;
  const { greeting } = req.body || {};

  try {
    // 1️⃣ Disable all events
    await pool.query("UPDATE events SET enabled = false");

    let query;
    let params;

    if (key === "christmas") {
      query = `
        UPDATE events
        SET enabled = true,
            config = jsonb_set(
              config,
              '{greeting}',
              to_jsonb($2::text),
              true
            )
        WHERE key = $1
        RETURNING *
      `;
      params = [key, greeting || "Chúc mừng Giáng Sinh – Hala Madrid 🎄"];
    } else {
      query = `
        UPDATE events
        SET enabled = true
        WHERE key = $1
        RETURNING *
      `;
      params = [key];
    }

    const { rows } = await pool.query(query, params);
    res.json(rows[0] || null);
  } catch (err) {
    console.error("PUT /events/:key/enable error:", err.message);
    res.status(500).json({ message: "Failed to enable event" });
  }
});

/**
 * ==========================================
 * DISABLE ALL EVENTS (ADMIN)
 * ==========================================
 * PUT /api/events/disable
 */
router.put("/disable", async (req, res) => {
  try {
    await pool.query("UPDATE events SET enabled = false");
    res.json(null);
  } catch (err) {
    console.error("PUT /events/disable error:", err.message);
    res.status(500).json({ message: "Failed to disable events" });
  }
});

module.exports = router;
