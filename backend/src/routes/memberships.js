// backend/src/routes/memberships.js
const express = require("express");
const { authMiddleware } = require("../middleware/authmiddleware");
const ctrl = require("../controllers/membershipscontroller");

const router = express.Router();

// Public
router.get("/plans", ctrl.listPlans);

// Private
router.get("/me", authMiddleware, ctrl.me);
router.post("/upgrade", authMiddleware, ctrl.upgradeToPremium);


module.exports = router;
