// backend/src/routes/users.js
const express = require("express");
const router = express.Router();
const { authMiddleware, adminOnly } = require("../middleware/authmiddleware");
const usersController = require("../controllers/userscontroller");

// 👇 NEW: user đang đăng nhập xem & sửa chính mình
router.get("/me", authMiddleware, usersController.getMe);
router.put("/me", authMiddleware, usersController.updateMeSelf);
router.put(
  "/:id/membership",
  authMiddleware,
  adminOnly,
  usersController.updateMembershipTier
);
// Admin-only CRUD
router.get("/", authMiddleware, adminOnly, usersController.listUsers);
router.get("/:id", authMiddleware, adminOnly, usersController.getUser);
router.post("/", authMiddleware, adminOnly, usersController.createUser);
router.put("/:id", authMiddleware, adminOnly, usersController.updateUser);
router.delete("/:id", authMiddleware, adminOnly, usersController.deleteUser);
router.get("/count", authMiddleware, adminOnly, usersController.countUsers);


module.exports = router;
