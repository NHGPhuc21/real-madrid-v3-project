// backend/src/routes/payments.js
const express = require("express");
const { authMiddleware } = require("../middleware/authmiddleware");
const ctrl = require("../controllers/paymentscontroller");

const router = express.Router();
router.post("/session", authMiddleware, ctrl.createSession);
router.get("/session/:id", authMiddleware, ctrl.getSession);
// mock “provider -> backend callback”
router.post("/callback", ctrl.mockCallback);
// Webhook thật từ provider (Stripe/VNPay/MoMo...). Body là raw do app.js đã gắn express.raw()
router.post("/webhook", ctrl.webhook); // KHÔNG authMiddleware
// tạo session thanh toán (mock)


module.exports = router;
