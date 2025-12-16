// backend/src/routes/matches.js
const express = require("express");
const router = express.Router();
const { authMiddleware, adminOnly } = require("../middleware/authmiddleware");
const matchesController = require("../controllers/matchescontroller");

// Public: list upcoming or all
router.get("/", matchesController.listMatches);
// Đặt /current TRƯỚC /:id để không bị nuốt bởi :id
router.get("/current", matchesController.getCurrentMatch);
router.get("/:id", matchesController.getMatch);

// Admin-only CRUD
router.post("/", authMiddleware, adminOnly, matchesController.createMatch);
router.put("/:id", authMiddleware, adminOnly, matchesController.updateMatch);
router.patch(
  "/:id/score",
  authMiddleware,
  adminOnly,
  matchesController.updateScore
);
router.delete("/:id", authMiddleware, adminOnly, matchesController.deleteMatch);

module.exports = router;
