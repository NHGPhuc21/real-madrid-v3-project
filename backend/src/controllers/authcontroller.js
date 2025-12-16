// backend/src/controllers/authcontroller.js

//Kiểm tra user tồn tại, Thêm user mới, Lấy thông tin user khi login
const pool = require("../../config/db");
//Hash password khi register, So sánh password khi login
const bcrypt = require("bcrypt");
//Sinh JWT token và Token dùng để:Xác thực các API sau login, Phân quyền admin / user
const jwt = require("jsonwebtoken");
//Gán Basic membership mặc định cho user mới
const membership = require("../services/membership"); // ✅ NEW
//load biến môi trường
require("dotenv").config();
//Độ mạnh của bcrypt hashing(10 là mức an toàn, không quá chậm)
const saltRounds = 10;
//hàm đăng kí
exports.register = async (req, res) => {
  //nhận dữ liệu đầu vào
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ message: "Missing fields" });
  //Kiểm tra user đã tồn tại chưa
  try {
    const existing = await pool.query(
      "SELECT userid FROM users WHERE email = $1 OR username = $2",
      [email, username]
    );
    if (existing.rows.length)
      return res.status(400).json({ message: "User already exists" });
    //password biến thành hash và không thể đảo ngược
    const hashed = await bcrypt.hash(password, saltRounds);
    //Thêm user vào database
    const insert = await pool.query(
      `INSERT INTO users (username, email, password, userrole)
       VALUES ($1,$2,$3,$4)
       RETURNING userid, username, email, userrole`,
      [username, email, hashed, "user"]
    );
    //Gán membership mặc định
    try {
      const userId = insert.rows[0].userid;
      await membership.ensureBasicOnRegister({ userId });
    } catch (e) {
      console.warn("[register] ensureBasic warn:", e?.message);
    }
    //Trả response thành công
    return res.status(201).json({ user: insert.rows[0] });
  } catch (err) {
    //Trả response thất bại
    console.error("register error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
//Hàm login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Missing fields" });

  try {
    //Case do not have this user
    const result = await pool.query(
      "SELECT userid, username, password, userrole, membershiptier FROM users WHERE email = $1",
      [email]
    );
    if (result.rows.length === 0)
      return res.status(400).json({ message: "Invalid credentials" });

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { userId: user.userid, username: user.username, role: user.userrole },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );
    //Return response login
    return res.json({
      token,
      user: {
        id: user.userid,
        username: user.username,
        role: user.userrole,
        membershiptier: user.membershiptier || "basic",
      },
    });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

//File authcontroller.js chịu trách nhiệm xử lý nghiệp vụ đăng ký và đăng nhập người dùng, bao gồm kiểm tra dữ liệu, mã hóa mật khẩu, 
// xác thực thông tin đăng nhập và phát hành JWT token. Đồng thời, hệ thống tự động gán gói membership mặc định cho người dùng mới