// backend/src/routes/highlights.js
const express = require("express");
const router = express.Router();
const { authMiddleware, adminOnly } = require("../middleware/authmiddleware");
const { upload } = require("../middleware/uploadMulter");
const ctrl = require("../controllers/highlightscontroller");

// ===== Public =====
router.get("/", ctrl.list);
router.get("/:id", ctrl.detail);
router.post("/:id/view", ctrl.addView); // tăng view

// ===== Admin =====
router.post(
  "/upload",
  authMiddleware,
  adminOnly,
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "thumb", maxCount: 1 },
  ]),
  ctrl.upload
);

router.patch("/:id", authMiddleware, adminOnly, ctrl.update);
router.patch("/:id/status", authMiddleware, adminOnly, ctrl.updateStatus);
router.delete("/:id", authMiddleware, adminOnly, ctrl.remove);

module.exports = router;
