const path = require("path");
const fs = require("fs");
const pool = require("../../config/db");
const { transcodeToHLS } = require("../utils/ffmpeg");
const { UPLOAD_ROOT } = require("../middleware/uploadMulter");

function publicPath(abs) {
  const rel = path
    .relative(path.join(__dirname, "../../"), abs)
    .split(path.sep)
    .join("/");
  return `/${rel}`;
}

/** Chuẩn hoá public (/uploads/...) -> absolute trong uploads (chịu đc nhiều format) */
function absFromPublic(pub) {
  if (!pub || typeof pub !== "string") return null;

  let s = String(pub).replace(/\\/g, "/"); // Windows -> /
  // nếu là URL đầy đủ thì cắt từ /uploads/ trở đi
  const idx = s.indexOf("/uploads/");
  if (idx >= 0) s = s.slice(idx);
  // bỏ leading slash
  if (s.startsWith("/")) s = s.slice(1);
  if (!s.startsWith("uploads/")) return null;

  const rest = s.slice("uploads/".length);
  return path.join(UPLOAD_ROOT, rest);
}

const highlightsController = {
  // ======= GIỮ NGUYÊN CÁC API KHÁC (upload / list / detail / update) =======
  upload: async (req, res) => {
    try {
      const user = req.user || {};
      if (user.role !== "admin")
        return res.status(403).json({ message: "Forbidden" });

      const {
        matchId = null,
        title,
        description = null,
        status = "draft",
      } = req.body || {};
      if (!title) return res.status(400).json({ message: "Title is required" });

      const videoFile = (req.files?.video || [])[0];
      if (!videoFile)
        return res.status(400).json({ message: "Video (MP4) is required" });

      const thumbFile = (req.files?.thumb || [])[0];

      const ins = await pool.query(
        `INSERT INTO highlightvideos (matchid, title, description, status)
         VALUES ($1,$2,$3,$4) RETURNING videoid, createdat`,
        [
          matchId ? Number(matchId) : null,
          title,
          description,
          (status || "draft").toLowerCase(),
        ]
      );
      const { videoid } = ins.rows[0];

      const sourceMP4 = publicPath(videoFile.path);
      const thumbURL = thumbFile ? publicPath(thumbFile.path) : null;

      const hlsFolderName = `hls_${videoid}_${Date.now()}`;
      const hlsAbsDir = path.join(UPLOAD_ROOT, "hls", hlsFolderName);
      if (!fs.existsSync(hlsAbsDir))
        fs.mkdirSync(hlsAbsDir, { recursive: true });

      await pool.query(
        `UPDATE highlightvideos
           SET thumburl=$1, sourcemp4=$2, hlspath=$3, updatedat=CURRENT_TIMESTAMP
         WHERE videoid=$4`,
        [thumbURL, sourceMP4, publicPath(hlsAbsDir), videoid]
      );

      transcodeToHLS(videoFile.path, hlsAbsDir)
        .then(async () => {
          await pool.query(
            `UPDATE highlightvideos
               SET updatedat=CURRENT_TIMESTAMP
             WHERE videoid=$1`,
            [videoid]
          );
          console.log(`[HLS] Transcode done for video #${videoid}`);
        })
        .catch((err) => {
          console.error("[HLS] Transcode error:", err);
        });

      return res.status(201).json({
        videoId: videoid,
        message: "Uploaded. Transcoding started.",
        sourceMP4,
        thumbURL,
        hlsPath: publicPath(hlsAbsDir),
      });
    } catch (err) {
      console.error("upload highlight error:", err);
      res.status(500).json({ message: "Server error" });
    }
  },

  list: async (req, res) => {
    try {
      const {
        status = "",
        q = "",
        page = 1,
        limit = 12,
        sort = "recent",
        excludeId = "",
      } = req.query;

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const pageSize = Math.min(60, Math.max(1, parseInt(limit, 10) || 12));
      const offset = (pageNum - 1) * pageSize;

      const where = [];
      const params = [];

      if (status) {
        params.push(status.toLowerCase());
        where.push(`LOWER(h.status) = $${params.length}`);
      }
      if (q) {
        params.push(`%${q}%`);
        where.push(
          `(h.title ILIKE $${params.length} OR h.description ILIKE $${params.length})`
        );
      }
      if (excludeId) {
        params.push(Number(excludeId));
        where.push(`h.videoid <> $${params.length}`);
      }
      const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

      const countSql = `SELECT COUNT(*)::INT AS total FROM highlightvideos h ${whereSql}`;
      const cnt = await pool.query(countSql, params);
      const total = cnt.rows[0]?.total || 0;

      let orderSql = `h.createdat DESC`;
      const s = String(sort || "").toLowerCase();
      if (s === "views_desc" || s === "views") {
        orderSql = `COALESCE(h.views,0) DESC, h.createdat DESC`;
      }

      params.push(pageSize, offset);
      const itemsSql = `
        SELECT h.videoid, h.matchid, h.title, h.description, h.status, h.thumburl, h.sourcemp4, h.hlspath,
               h.durationsec, h.views, h.createdat, h.updatedat, m.opponentteam, m.matchdatetime
          FROM highlightvideos h
          LEFT JOIN matches m ON m.matchid = h.matchid
          ${whereSql}
          ORDER BY ${orderSql}
          LIMIT $${params.length - 1} OFFSET $${params.length}
      `;
      const list = await pool.query(itemsSql, params);

      res.json({ items: list.rows, total, page: pageNum, limit: pageSize });
    } catch (err) {
      console.error("list highlights error:", err);
      res.status(500).json({ message: "Server error" });
    }
  },

  detail: async (req, res) => {
    try {
      const id = Number(req.params.id);
      const r = await pool.query(
        `SELECT videoid, matchid, title, description, status, thumburl, sourcemp4, hlspath,
                durationsec, views, createdat, updatedat
           FROM highlightvideos WHERE videoid=$1`,
        [id]
      );
      if (!r.rows.length) return res.status(404).json({ message: "Not found" });
      res.json(r.rows[0]);
    } catch (err) {
      console.error("detail highlight error:", err);
      res.status(500).json({ message: "Server error" });
    }
  },

  update: async (req, res) => {
    try {
      const user = req.user || {};
      if (user.role !== "admin")
        return res.status(403).json({ message: "Forbidden" });

      const id = Number(req.params.id);
      const {
        title = null,
        description = null,
        status = null,
      } = req.body || {};

      const fields = [];
      const params = [];

      if (title !== null) {
        params.push(title);
        fields.push(`title=$${params.length}`);
      }
      if (description !== null) {
        params.push(description);
        fields.push(`description=$${params.length}`);
      }

      let nextStatus = null;
      if (status !== null) {
        nextStatus = String(status).toLowerCase();
        params.push(nextStatus);
        fields.push(`status=$${params.length}`);

        if (nextStatus === "published") {
          fields.push(`publishedat=COALESCE(publishedat, CURRENT_TIMESTAMP)`);
        } else {
          fields.push(`publishedat=NULL`);
        }
      }

      if (!fields.length) return res.json({ updated: 0 });

      params.push(id);
      const sql = `UPDATE highlightvideos SET ${fields.join(
        ", "
      )}, updatedat=CURRENT_TIMESTAMP WHERE videoid=$${
        params.length
      } RETURNING *`;
      const r = await pool.query(sql, params);
      if (!r.rows.length) return res.status(404).json({ message: "Not found" });
      res.json(r.rows[0]);
    } catch (err) {
      console.error("update highlight error:", err);
      res.status(500).json({ message: "Server error" });
    }
  },
};

/** PATCH /api/highlights/:id/status (admin) */
async function updateStatus(req, res) {
  try {
    const user = req.user || {};
    if (user.role !== "admin")
      return res.status(403).json({ message: "Forbidden" });

    const id = Number(req.params.id);
    let { status } = req.body || {};
    status = String(status || "").toLowerCase();
    if (!["draft", "published", "archived"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const pubAtSql = status === "published" ? "CURRENT_TIMESTAMP" : "NULL";
    const r = await pool.query(
      `UPDATE highlightvideos
         SET status=$1, publishedat=${pubAtSql}, updatedat=CURRENT_TIMESTAMP
       WHERE videoid=$2
       RETURNING *`,
      [status, id]
    );
    if (!r.rows.length) return res.status(404).json({ message: "Not found" });
    res.json(r.rows[0]);
  } catch (err) {
    console.error("updateStatus error:", err);
    res.status(500).json({ message: "Server error" });
  }
}

/**
 * DELETE /api/highlights/:id (admin)
 * Xoá record và các file liên quan (HLS folder, MP4, thumbnail)
 */
async function remove(req, res) {
  try {
    const user = req.user || {};
    if (user.role !== "admin")
      return res.status(403).json({ message: "Forbidden" });

    const id = Number(req.params.id);

    const r0 = await pool.query(
      `SELECT videoid, hlspath, sourcemp4, thumburl
         FROM highlightvideos WHERE videoid=$1`,
      [id]
    );
    if (!r0.rows.length) return res.status(404).json({ message: "Not found" });

    const { hlspath, sourcemp4, thumburl } = r0.rows[0];

    // --- Tìm thư mục HLS: có thể là folder hoặc là .../index.m3u8 ---
    let hlsDir = null;
    const cand = absFromPublic(hlspath);
    try {
      if (cand && fs.existsSync(cand)) {
        const stat = fs.lstatSync(cand);
        hlsDir = stat.isDirectory() ? cand : path.dirname(cand);
      }
    } catch (_) {}

    // Fallback: nếu DB không có/không tồn tại -> quét thư mục hls theo prefix
    if (!hlsDir) {
      try {
        const hlsRoot = path.join(UPLOAD_ROOT, "hls");
        const names = fs.existsSync(hlsRoot) ? fs.readdirSync(hlsRoot) : [];
        for (const name of names) {
          if (name.startsWith(`hls_${id}_`)) {
            hlsDir = path.join(hlsRoot, name);
            break;
          }
        }
      } catch (_) {}
    }

    // Xoá HLS dir (best-effort)
    try {
      if (hlsDir && fs.existsSync(hlsDir)) {
        fs.rmSync(hlsDir, { recursive: true, force: true });
      }
    } catch (e) {
      console.warn("[delete] remove HLS dir failed:", e?.message || e);
    }

    // Xoá file MP4
    try {
      const mp4Abs = absFromPublic(sourcemp4);
      if (mp4Abs && fs.existsSync(mp4Abs)) fs.unlinkSync(mp4Abs);
    } catch (e) {
      console.warn("[delete] remove MP4 failed:", e?.message || e);
    }

    // Xoá thumbnail
    try {
      const thumbAbs = absFromPublic(thumburl);
      if (thumbAbs && fs.existsSync(thumbAbs)) fs.unlinkSync(thumbAbs);
    } catch (e) {
      console.warn("[delete] remove thumbnail failed:", e?.message || e);
    }

    // Xoá record DB
    const r = await pool.query(`DELETE FROM highlightvideos WHERE videoid=$1`, [
      id,
    ]);
    if (r.rowCount === 0) return res.status(404).json({ message: "Not found" });

    res.json({ ok: true });
  } catch (err) {
    console.error("remove highlight error:", err);
    res.status(500).json({ message: "Server error" });
  }
}

/** POST /api/highlights/:id/view (public) */
async function addView(req, res) {
  try {
    const id = Number(req.params.id);
    const r = await pool.query(
      `UPDATE highlightvideos
         SET views = COALESCE(views,0) + 1
       WHERE videoid=$1
       RETURNING views`,
      [id]
    );
    if (!r.rows.length) return res.status(404).json({ message: "Not found" });
    res.json({ views: r.rows[0].views });
  } catch (err) {
    console.error("addView error:", err);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  ...highlightsController,
  updateStatus,
  remove,
  addView,
};
