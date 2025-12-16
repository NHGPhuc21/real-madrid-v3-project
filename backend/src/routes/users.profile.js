// backend/src/routes/users.profile.js
const express = require("express");
const router = express.Router();
const pool = require("../../config/db");
const { authMiddleware } = require("../middleware/authmiddleware");

// ✅ Lấy thông tin cá nhân + ngày tham gia
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const r = await pool.query(
      `SELECT userid, username, email, phonenumber, address, userrole, create_at
       FROM users WHERE userid=$1`,
      [userId]
    );
    if (!r.rows.length)
      return res.status(404).json({ message: "User not found" });
    res.json(r.rows[0]);
  } catch (e) {
    console.error("GET /users/me error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Cập nhật thông tin cá nhân (không đụng tới email)
router.put("/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { username, phonenumber, address } = req.body; // 👈 bỏ email ra

    await pool.query(
      `UPDATE users
       SET username=$1,
           phonenumber=$2,
           address=$3,
           update_at=NOW()
       WHERE userid=$4`,
      [username, phonenumber, address, userId]
    );

    // Trả về bản ghi mới nhất cho FE
    const r = await pool.query(
      `SELECT userid, username, email, phonenumber, address, userrole, create_at
       FROM users WHERE userid=$1`,
      [userId]
    );

    res.json(r.rows[0]);
  } catch (e) {
    console.error("PUT /users/me error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
