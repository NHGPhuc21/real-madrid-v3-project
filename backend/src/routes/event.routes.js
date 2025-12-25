const express = require("express");
const router = express.Router();
const pool = require("../../config/db");

/**
 * GET active event
 * Trả về event đang enabled (hoặc null)
 */
router.get("/active", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM events WHERE enabled = true LIMIT 1"
    );
    res.json(rows[0] || null);
  } catch (err) {
    console.error("GET /events/active error:", err.message);
    res.status(500).json({ message: "Failed to load active event" });
  }
});

/**
 * ENABLE one event (admin)
 * - Disable tất cả
 * - Enable event theo key
 * - Với christmas: nhận greeting từ body và lưu vào config
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
 * DISABLE all events (admin)
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
