// backend/src/routes/ticketorders.js
const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authmiddleware");
const ctrl = require("../controllers/ticketorderscontroller");

router.post("/quick-buy", authMiddleware, ctrl.quickBuy);
router.get("/my", authMiddleware, ctrl.getMyTickets);

// NEW: chi tiết 1 ticket order
router.get("/:id", authMiddleware, ctrl.getTicketOrderDetail);

// NEW: thanh toán ticket order bằng ví
router.post("/:id/pay-wallet", authMiddleware, ctrl.payWithWallet);
module.exports = router;
