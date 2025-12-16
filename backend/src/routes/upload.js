const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const uploadCtrl = require("../controllers/uploadcontroller");

// ===============================
// 1) PLAYERS UPLOAD
// ===============================
const UPLOAD_DIR_PLAYERS = path.join(__dirname, "../../uploads/players");
fs.mkdirSync(UPLOAD_DIR_PLAYERS, { recursive: true });

const storagePlayers = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR_PLAYERS),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const name = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, name);
  },
});
const uploadPlayers = multer({ storage: storagePlayers });
router.post("/players", uploadPlayers.single("image"), uploadCtrl.uploadImage);

// ===============================
// 2) NEWS UPLOAD
// ===============================
const UPLOAD_DIR_NEWS = path.join(__dirname, "../../uploads/news");
fs.mkdirSync(UPLOAD_DIR_NEWS, { recursive: true });

const storageNews = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR_NEWS),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const name = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, name);
  },
});
const uploadNews = multer({ storage: storageNews });
router.post("/news", uploadNews.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  res.json({ url: `/uploads/news/${req.file.filename}` });
});

// ===============================
// 3) OPPONENT LOGO UPLOAD (MỚI)
// ===============================
const UPLOAD_DIR_OPPONENTS = path.join(__dirname, "../../uploads/opponents");
fs.mkdirSync(UPLOAD_DIR_OPPONENTS, { recursive: true });

const storageOpponents = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR_OPPONENTS),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".png";
    const name = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, name);
  },
});
const uploadOpponents = multer({ storage: storageOpponents });

router.post("/opponents", uploadOpponents.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  res.json({
    url: `/uploads/opponents/${req.file.filename}`,
  });
});

module.exports = router;
