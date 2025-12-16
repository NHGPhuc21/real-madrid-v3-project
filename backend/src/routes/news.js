// news.js
const express = require("express");
const router = express.Router();
const newsController = require("../controllers/newscontroller");
const { authMiddleware, adminOnly } = require("../middleware/authmiddleware");

// Public
router.get("/featured", newsController.getFeaturedNews); // Đặt TRƯỚC :id
router.get("/topics", newsController.getTopics);
router.get("/:id", newsController.getNewsById);
router.get("/", newsController.getAllNews);


// Admin
router.post("/", authMiddleware, adminOnly, newsController.createNews);
router.put("/:id", authMiddleware, adminOnly, newsController.updateNews);
router.delete("/:id", authMiddleware, adminOnly, newsController.deleteNews);


module.exports = router;
