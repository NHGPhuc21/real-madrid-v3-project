// backend/src/routes/products.js
const express = require("express");
const router = express.Router();
const productsController = require("../controllers/productsController");
const { authMiddleware, adminOnly } = require("../middleware/authmiddleware");

// Search + paging + filter cho Shop.vue
router.get("/", productsController.searchAndList);

// Lấy toàn bộ - đặt TRƯỚC /:id để không bị nuốt
router.get("/all", productsController.getAllProducts);

// Chi tiết theo id (KHÔNG dùng regex ràng buộc)
router.get("/:id", productsController.getProductById);

// Admin CRUD
router.post("/", authMiddleware, adminOnly, productsController.createProduct);
router.put("/:id", authMiddleware, adminOnly, productsController.updateProduct);
router.delete(
  "/:id",
  authMiddleware,
  adminOnly,
  productsController.deleteProduct
);

module.exports = router;
