// backend/src/controllers/uploadcontroller.js
const path = require("path");

exports.uploadImage = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // file đã nằm trong uploads/players
    const filename = req.file.filename;

    // đường dẫn tương đối để frontend lưu vào imageurl
    const relativeUrl = "/uploads/players/" + filename;

    return res.json({
      url: relativeUrl,
    });
  } catch (err) {
    console.error("uploadImage error:", err);
    res.status(500).json({ error: err.message || "Upload failed" });
  }
};
