// backend/src/controllers/membershipscontroller.js
const pool = require("../../config/db");
const membership = require("../services/membership");

module.exports = {
  async listPlans(req, res) {
    try {
      const r = await pool.query(
        `SELECT code, name, price, duration_months, perks FROM membership_plans WHERE active=true ORDER BY id ASC`
      );
      res.json(r.rows);
    } catch (e) {
      console.error("listPlans error:", e);
      res.status(500).json({ message: "Server error" });
    }
  },

  async me(req, res) {
    try {
      const userId = req.user.userId;
      const cur = await membership.getCurrentMembership({ userId });
      res.json(cur || null);
    } catch (e) {
      console.error("me membership error:", e);
      res.status(500).json({ message: "Server error" });
    }
  },

  /** Tạo 1 order membership premium (không qua cart), trả về orderId */
  /** Tạo 1 order membership premium + lưu ngày nâng cấp vào users.premium_start */
  async upgradeToPremium(req, res) {
    const userId = req.user.userId;
    try {
      // 1) Tạo order Premium
      const r = await membership.createPremiumOrder({ userId }, pool);

      // 2) Cập nhật ngày bắt đầu Premium (nếu chưa có)
      await pool.query(
        `UPDATE users
       SET premium_start = NOW(),
           membershiptier = 'premium'
       WHERE userid = $1`,
        [userId]
      );

      res.status(201).json(r);
    } catch (e) {
      console.error("upgradeToPremium error:", e);
      res.status(500).json({ message: e.message || "Server error" });
    }
  },
};
