// backend/src/controllers/userscontroller.js
const pool = require("../../config/db");
const bcrypt = require("bcrypt");

// Helper: lấy userid từ req.user (tùy authmiddleware bạn đang set)
function getUserIdFromReq(req) {
  const u = req.user || {};
  return u.userid || u.userId || u.id;
}

// GET all users
async function listUsers(req, res) {
  try {
    const result = await pool.query(
      'SELECT "userid", "username", "email", "userrole", "membershiptier" FROM "users" ORDER BY "userid"'
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET one user (admin dùng)
async function getUser(req, res) {
  const id = +req.params.id;
  try {
    const result = await pool.query(
      'SELECT "userid", "username", "email", "userrole", "membershiptier" FROM "users" WHERE "userid" = $1',
      [id]
    );

    if (!result.rows.length)
      return res.status(404).json({ message: "Not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
}

// CREATE
async function createUser(req, res) {
  const { username, email, password, userrole } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ message: "Missing fields" });
  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO "users" ("username", "email", "password", "userrole") VALUES ($1, $2, $3, $4) RETURNING "userid"',
      [username, email, hashed, userrole || "user"]
    );
    res.json({ id: result.rows[0].userid });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
}

// UPDATE (admin sửa user bất kỳ)
async function updateUser(req, res) {
  const id = +req.params.id;
  const { username, email, password, userrole } = req.body;
  try {
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      await pool.query(
        'UPDATE "users" SET "username"=$1, "email"=$2, "password"=$3, "userrole"=$4 WHERE "userid"=$5',
        [username, email, hashed, userrole, id]
      );
    } else {
      await pool.query(
        'UPDATE "users" SET "username"=$1, "email"=$2, "userrole"=$3 WHERE "userid"=$4',
        [username, email, userrole, id]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
}

// DELETE
async function deleteUser(req, res) {
  const id = +req.params.id;
  try {
    await pool.query('DELETE FROM "users" WHERE "userid" = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
}

// ĐẾN SAU CÁC HÀM KHÁC
async function countUsers(req, res) {
  try {
    const result = await pool.query(
      'SELECT COUNT(*)::int AS total FROM "users"'
    );
    res.json({ total: result.rows[0].total });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
}

/* ============ NEW: API cho /users/me ============ */

// GET /users/me – thông tin user đang đăng nhập
// GET /users/me – thông tin user đang đăng nhập
async function getMe(req, res) {
  const id = getUserIdFromReq(req);
  if (!id) return res.status(401).json({ message: "Unauthenticated" });

  try {
    const result = await pool.query(
      `SELECT 
         userid,
         username,
         email,
         phonenumber,
         address,
         userrole,
         create_at,
         dateofbirth,
         membershiptier,
         premium_start       -- ⭐ THÊM DÒNG NÀY
       FROM users
       WHERE userid = $1`,
      [id]
    );

    if (!result.rows.length)
      return res.status(404).json({ message: "Not found" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}


// PUT /users/me – user tự sửa profile (username, phone, address, dateofbirth)
// PUT /users/me – user tự sửa profile (username, phone, address, dateofbirth)
// PUT /users/me – user tự sửa profile (username, phone, address, dateofbirth)
// PUT /users/me – user tự sửa profile (username, phone, address, dateofbirth)
// PUT /users/me – user tự sửa profile (username, phone, address, dateofbirth)
async function updateMeSelf(req, res) {
  const id = getUserIdFromReq(req);
  if (!id) return res.status(401).json({ message: "Unauthenticated" });

  const { username, phonenumber, address, dateofbirth } = req.body;

  console.log("[updateMeSelf] userId =", id);
  console.log("[updateMeSelf] raw dateofbirth from client =", dateofbirth);

  // Chuẩn hóa dateofbirth về yyyy-mm-dd (hoặc null)
  let dob = null;
  if (dateofbirth) {
    try {
      const d = new Date(dateofbirth);
      if (!isNaN(d.getTime())) {
        dob = d.toISOString().slice(0, 10); // "2025-09-13"
      } else {
        console.warn("[updateMeSelf] invalid Date:", dateofbirth);
      }
    } catch (e) {
      console.error("[updateMeSelf] error parsing date:", dateofbirth, e);
    }
  }

  console.log("[updateMeSelf] normalized dob =", dob);

  try {
    const result = await pool.query(
      `UPDATE "users"
       SET "username"   = $1,
           "phonenumber"= $2,
           "address"    = $3,
           "dateofbirth"= $4,
           "update_at"  = NOW()
       WHERE "userid"   = $5
       RETURNING "userid","username","email","phonenumber",
                 "address","dateofbirth","userrole","create_at";`,
      [username, phonenumber, address, dob, id]
    );

    console.log("[updateMeSelf] rowCount =", result.rowCount);
    console.log("[updateMeSelf] updated row =", result.rows[0]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Trả luôn user mới để FE (và bạn) nhìn thấy giá trị mới
    return res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error("[updateMeSelf] error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// UPDATE ONLY MEMBERSHIP TIER
async function updateMembershipTier(req, res) {
  const id = +req.params.id;
  const { membershiptier } = req.body;

  if (!["basic", "premium"].includes(membershiptier)) {
    return res.status(400).json({ message: "Invalid membership tier" });
  }

  try {
    await pool.query(
      'UPDATE "users" SET "membershiptier" = $1 WHERE "userid" = $2',
      [membershiptier, id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}



// ✅ Export
module.exports = {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  countUsers,
  getMe, // NEW
  updateMeSelf, // NEW
  updateMembershipTier,
};
