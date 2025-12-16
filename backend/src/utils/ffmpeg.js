// backend/src/utils/ffmpeg.js
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

/**
 * Transcode MP4 -> HLS (single rendition) vào outputDir (tạo sẵn nếu chưa có)
 * Trả về Promise resolve({ ok: true, m3u8: 'index.m3u8' }) khi xong
 */
function transcodeToHLS(inputPath, outputDir) {
  ensureDir(outputDir);
  const outIndex = path.join(outputDir, "index.m3u8");
  const segPattern = path.join(outputDir, "segment_%03d.ts");

  const args = [
    "-y",
    "-i",
    inputPath,
    // video
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-profile:v",
    "main",
    "-level",
    "3.1",
    "-vf",
    "scale=w=1280:h=-2", // 720p-ish
    "-b:v",
    "2500k",
    "-maxrate",
    "2675k",
    "-bufsize",
    "3750k",
    // audio
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-ac",
    "2",
    // HLS
    "-f",
    "hls",
    "-hls_time",
    "4",
    "-hls_playlist_type",
    "vod",
    "-hls_segment_filename",
    segPattern,
    outIndex,
  ];

  return new Promise((resolve, reject) => {
    const ff = spawn("ffmpeg", args, { stdio: "inherit" });

    ff.on("error", (err) => reject(err));
    ff.on("close", (code) => {
      if (code === 0) return resolve({ ok: true, m3u8: outIndex });
      reject(new Error(`ffmpeg exited with code ${code}`));
    });
  });
}

module.exports = { transcodeToHLS };
