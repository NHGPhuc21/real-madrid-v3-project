const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authmiddleware");
const ctrl = require("../controllers/myticketscontroller");

router.get("/", authMiddleware, ctrl.listMyTickets);

module.exports = router;
