// backend/src/controllers/newscontroller.js
// ============================================================
// Giữ nguyên cấu trúc và các hàm như bản cũ, CHỈ BỔ SUNG hỗ trợ "topic".
// Nếu DB chưa có cột Topic, chạy một lần:
//   ALTER TABLE News ADD COLUMN IF NOT EXISTS Topic VARCHAR(50) DEFAULT 'general';
// ============================================================

const pool = require("../../config/db");

// ============================================================
// Controller: News
// Các hàm giữ nguyên tên + thứ tự như bản cũ:
//   - getAllNews
//   - getNewsById
//   - createNews
//   - updateNews
//   - deleteNews
// Bổ sung duy nhất: hỗ trợ field "topic" và lọc theo query ?topic=...
// ============================================================

const newsController = {
  // ----------------------------------------------------------
  // GET /api/news
  //  - Hành vi mặc định (không có query) GIỮ NGUYÊN: trả toàn bộ news
  //  - BỔ SUNG: ?topic=abc để lọc theo chủ đề (tùy chọn)
  //  - Thứ tự sắp xếp GIỮ NGUYÊN: ORDER BY newid DESC
  // ----------------------------------------------------------
  getAllNews: async (req, res) => {
    try {
      // ========= BỔ SUNG: đọc topic từ query string (optional) =========
      const { topic } = req.query;

      // Khi không có topic => giữ nguyên logic cũ: trả toàn bộ bản ghi
      // Khi có topic => thêm WHERE topic = $1
      let sql = "SELECT * FROM news";
      const params = [];

      if (topic && String(topic).trim() !== "") {
        sql += " WHERE topic = $1";
        params.push(String(topic).trim());
      }

      sql += " ORDER BY newid DESC";

      const result = await pool.query(sql, params);
      res.json(result.rows);
    } catch (err) {
      console.error("getAllNews error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // ----------------------------------------------------------
  // GET /api/news/:id
  //  - Không thay đổi
  // ----------------------------------------------------------
  getNewsById: async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM news WHERE newid=$1", [
        req.params.id,
      ]);
      if (result.rows.length === 0)
        return res.status(404).json({ message: "News not found" });
      res.json(result.rows[0]);
    } catch (err) {
      console.error("getNewsById error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // ----------------------------------------------------------
  // POST /api/news
  //  - Giữ nguyên các field cũ (title, content, authorid, imageurl, ispublished)
  //  - BỔ SUNG: topic (tùy chọn). Nếu không gửi => 'general'
  // ----------------------------------------------------------
  createNews: async (req, res) => {
    try {
      // ====== GIỮ NGUYÊN CŨ + BỔ SUNG "topic" ======
      const {
        title,
        content,
        authorid,
        imageurl,
        ispublished,
        topic,
        is_featured, // <-- bổ sung
      } = req.body;

      // Lưu ý: Cột "topic" cần tồn tại trong DB (ALTER TABLE ở trên).
      // Nếu FE không gửi, gán mặc định 'general' để tương thích.
      const safeTopic =
        topic && String(topic).trim() !== "" ? String(topic).trim() : "general";
      
      const result = await pool.query(
        // ======= CHỈ BỔ SUNG CỘT topic VÀO CÂU LỆNH INSERT =========
        "INSERT INTO news (title, content, authorid, imageurl, ispublished, topic, is_featured) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *",
        [
          title,
          content,
          authorid || null,
          imageurl || null,
          ispublished === undefined ? true : ispublished,
          safeTopic,
          !!is_featured, // <--- thêm vào cuối
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error("createNews error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // ----------------------------------------------------------
  // PUT /api/news/:id
  //  - Giữ nguyên các field cũ
  //  - BỔ SUNG: cập nhật "topic" nếu có gửi lên
  // ----------------------------------------------------------
  updateNews: async (req, res) => {
    try {
      // ====== GIỮ NGUYÊN CŨ + BỔ SUNG "topic" ======
      const {
        title,
        content,
        imageurl,
        ispublished,
        topic,
        is_featured, // <-- bổ sung
      } = req.body;

      // Giải quyết giá trị topic an toàn (hoặc 'general' nếu không có)
      const safeTopic =
        topic && String(topic).trim() !== "" ? String(topic).trim() : "general";

      const result = await pool.query(
        // ======= CHỈ BỔ SUNG CỘT topic VÀO CÂU LỆNH UPDATE =========
        "UPDATE news SET title=$1, content=$2, imageurl=$3, ispublished=$4, topic=$5,is_featured=$6, update_at=NOW() WHERE newid=$7 RETURNING *",
        [
          title,
          content,
          imageurl || null,
          ispublished === undefined ? true : ispublished,
          safeTopic,
          !!is_featured, // <--- thêm
          req.params.id,
        ]
      );

      if (result.rows.length === 0)
        return res.status(404).json({ message: "News not found" });

      res.json(result.rows[0]);
    } catch (err) {
      console.error("updateNews error:", err);
      res.status(500).json({ error: err.message });
    }
  },
  // ----------------------------------------------------------
  // GET /api/news/topics
  //  - Trả về danh sách topic duy nhất
  // ----------------------------------------------------------
  getTopics: async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT DISTINCT topic FROM news ORDER BY topic ASC"
      );
      res.json(result.rows.map((r) => r.topic));
    } catch (err) {
      console.error("getTopics error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // ----------------------------------------------------------
  // DELETE /api/news/:id
  //  - Không thay đổi
  // ----------------------------------------------------------
  deleteNews: async (req, res) => {
    try {
      const result = await pool.query("DELETE FROM news WHERE newid=$1", [
        req.params.id,
      ]);
      if (result.rowCount === 0)
        return res.status(404).json({ message: "News not found" });
      res.json({ message: "News deleted" });
    } catch (err) {
      console.error("deleteNews error:", err);
      res.status(500).json({ error: err.message });
    }
  },
};
// ----------------------------------------------------------
// GET /api/news/featured → trả bài viết có is_featured = true
// ----------------------------------------------------------
newsController.getFeaturedNews = async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT *
       FROM news
       WHERE is_featured = TRUE AND ispublished = TRUE
       ORDER BY publishdate DESC, update_at DESC
       LIMIT 1`
    );
    res.json(r.rows[0] || null);
  } catch (err) {
    console.error("getFeaturedNews error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// Export
// ============================================================
module.exports = newsController;

// ============================================================
// Ghi chú triển khai nhanh FE (không ảnh hưởng BE):
//  - Gọi /api/news?topic=club để lấy danh sách topic "club"
//  - Gọi /api/news?topic=academy để lấy topic "academy"
//  - Nếu không truyền topic => hành vi cũ: trả toàn bộ bản ghi
// ============================================================
