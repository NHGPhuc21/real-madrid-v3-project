// backend/src/middleware/uploadMulter.js
const path = require("path");
const fs = require("fs");
const multer = require("multer");

/**
 * ==========================================
 * ROOT UPLOAD DIRECTORIES (GIỮ NGUYÊN)
 * ==========================================
 */
const UPLOAD_ROOT = path.join(__dirname, "../../uploads");
const SRC_DIR = path.join(UPLOAD_ROOT, "videos", "sources");
const POSTER_DIR = path.join(UPLOAD_ROOT, "videos", "posters");

/**
 * ==========================================
 * 🎄 CHRISTMAS MUSIC DIRECTORY (MỚI)
 * ==========================================
 */
const MUSIC_DIR = path.join(UPLOAD_ROOT, "events", "christmas");

/**
 * ==========================================
 * ENSURE DIRECTORIES EXIST
 * ==========================================
 */
for (const d of [UPLOAD_ROOT, SRC_DIR, POSTER_DIR, MUSIC_DIR]) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

/**
 * ==========================================
 * FILE FILTER (GIỮ NGUYÊN + THÊM MUSIC)
 * ==========================================
 */
function fileFilter(req, file, cb) {
  // 🎥 Video upload (GIỮ NGUYÊN)
  if (file.fieldname === "video") {
    if (/mp4|mpeg4/.test(file.mimetype) || /\.mp4$/i.test(file.originalname)) {
      return cb(null, true);
    }
    return cb(new Error("Video must be MP4"), false);
  }

  // 🖼 Thumbnail upload (GIỮ NGUYÊN)
  if (file.fieldname === "thumb") {
    if (/image\/(png|jpe?g)/.test(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new Error("Thumb must be PNG/JPG"), false);
  }

  // 🎵 Christmas music upload (MỚI)
  if (file.fieldname === "music") {
    if (file.mimetype === "audio/mpeg") {
      return cb(null, true);
    }
    return cb(new Error("Music must be MP3"), false);
  }

  // ❌ Không chấp nhận field khác
  cb(new Error("Invalid upload field"), false);
}

/**
 * ==========================================
 * STORAGE CONFIG
 * ==========================================
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 🎥 Video
    if (file.fieldname === "video") return cb(null, SRC_DIR);

    // 🖼 Thumbnail
    if (file.fieldname === "thumb") return cb(null, POSTER_DIR);

    // 🎵 Christmas music
    if (file.fieldname === "music") return cb(null, MUSIC_DIR);

    cb(new Error("Invalid upload destination"), null);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const base = path
      .basename(file.originalname || "upload", ext)
      .replace(/\s+/g, "_");
    cb(null, `${Date.now()}_${base}${ext}`);
  },
});

/**
 * ==========================================
 * MULTER INSTANCE (GIỮ NGUYÊN LIMIT)
 * ==========================================
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1GB (giữ nguyên cho video)
  },
});

module.exports = {
  upload,
  UPLOAD_ROOT,
  SRC_DIR,
  POSTER_DIR,
  MUSIC_DIR, // export thêm (không ảnh hưởng logic cũ)
};
