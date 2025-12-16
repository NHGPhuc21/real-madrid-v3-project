// backend/src/middleware/uploadMulter.js
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const UPLOAD_ROOT = path.join(__dirname, "../../uploads");
const SRC_DIR = path.join(UPLOAD_ROOT, "videos", "sources");
const POSTER_DIR = path.join(UPLOAD_ROOT, "videos", "posters");

for (const d of [UPLOAD_ROOT, SRC_DIR, POSTER_DIR]) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "video") return cb(null, SRC_DIR);
    if (file.fieldname === "thumb") return cb(null, POSTER_DIR);
    cb(null, SRC_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const base = path
      .basename(file.originalname || "upload", ext)
      .replace(/\s+/g, "_");
    cb(null, `${Date.now()}_${base}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  if (file.fieldname === "video") {
    // chấp nhận mp4 cơ bản
    if (/mp4|mpeg4/.test(file.mimetype) || /\.mp4$/i.test(file.originalname))
      return cb(null, true);
    return cb(new Error("Video must be MP4"), false);
  }
  if (file.fieldname === "thumb") {
    if (/image\/(png|jpe?g)/.test(file.mimetype)) return cb(null, true);
    return cb(new Error("Thumb must be PNG/JPG"), false);
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1GB
  },
});

module.exports = {
  upload,
  UPLOAD_ROOT,
  SRC_DIR,
  POSTER_DIR,
};
