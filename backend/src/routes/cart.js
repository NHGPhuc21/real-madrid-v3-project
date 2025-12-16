// backend / src / routes / cart.js;
const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authmiddleware");
const cartCtrl = require("../controllers/cartcontroller");

// all routes require login
router.get("/", authMiddleware, cartCtrl.getCart);
router.post("/", authMiddleware, cartCtrl.addToCart);
router.put("/:productId", authMiddleware, cartCtrl.updateQuantity);
router.delete("/:productId", authMiddleware, cartCtrl.removeFromCart);

module.exports = router;
