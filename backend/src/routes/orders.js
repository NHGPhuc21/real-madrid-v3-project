// backend/src/routes/orders.js
const express = require("express");
const router = express.Router();
const { authMiddleware, adminOnly } = require("../middleware/authmiddleware");
const ordersCtrl = require("../controllers/orderscontroller");

// ========== ADMIN (ĐẶT TRƯỚC "/:id" ĐỂ KHÔNG BỊ NUỐT) ==========
router.get("/admin", authMiddleware, adminOnly, ordersCtrl.adminList);
router.put(
  "/admin/:id/status",
  authMiddleware,
  adminOnly,
  ordersCtrl.adminUpdateStatus
);
router.delete("/admin/:id", authMiddleware, adminOnly, ordersCtrl.adminDelete);

// ========== USER ==========
router.post("/", authMiddleware, ordersCtrl.checkoutFromCart);
router.get("/", authMiddleware, ordersCtrl.listMyOrders);
// Hủy (user)
router.patch("/:id/cancel", authMiddleware, ordersCtrl.cancelOrder);
router.post("/:id/cancel", authMiddleware, ordersCtrl.userCancel);
// 🔹 Pay now (giả lập): set paymentstatus='paid' + đẩy trạng thái xử lý
router.post("/:id/pay", authMiddleware, ordersCtrl.userPayNow);

// Cuối cùng mới tới chi tiết theo id
router.get("/:id", authMiddleware, ordersCtrl.getOrderDetail);
// Pay now (giả lập): user thanh toán đơn của mình


module.exports = router;
