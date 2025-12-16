// backend/src/controllers/matchescontroller.js
const pool = require("../../config/db");

// GET /api/matches?upcoming=1
exports.listMatches = async (req, res) => {
  try {
    const { upcoming } = req.query;

    // Cột trạng thái: 'upcoming' | 'live' | 'finished'
    // Khi upcoming=1: lọc CHÍNH XÁC theo status (không phụ thuộc datetime)
    // Dự phòng: nếu status NULL thì coi như 'upcoming'
    let sql = `
      SELECT
        matchid,
        opponentteam,
        opponentteamlogourl,
        to_char(matchdatetime, 'YYYY-MM-DD"T"HH24:MI:SS') AS matchdatetime,
        stadium,
        competition,
        ishomematch,
        description,
        COALESCE(homescore, 0)  AS homescore,
        COALESCE(awayscore, 0)  AS awayscore,
        COALESCE(status, 'upcoming') AS status
      FROM matches
    `;

    const params = [];

    if (upcoming === "1") {
      sql += `
        WHERE LOWER(COALESCE(status, 'upcoming')) = 'upcoming'
      `;
      // Sắp xếp: có ngày thì tăng dần, không có ngày cho xuống cuối
      sql += ` ORDER BY matchdatetime ASC NULLS LAST`;
    } else {
      // Trả tất cả khi không có filter
      sql += ` ORDER BY matchdatetime ASC NULLS LAST`;
    }

    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error("listMatches error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/matches/:id
exports.getMatch = async (req, res) => {
  const id = Number(req.params.id);
  try {
    const result = await pool.query(
      `SELECT
        matchid,
        opponentteam,
        opponentteamlogourl,
        to_char(matchdatetime, 'YYYY-MM-DD"T"HH24:MI:SS') AS matchdatetime,
        stadium,
        competition,
        ishomematch,
        description,
        homescore,
        awayscore,
        status
      FROM matches
      WHERE matchid = $1`,
      [id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Match not found" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("getMatch error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// POST /api/matches
exports.createMatch = async (req, res) => {
  const {
    opponentteam,
    opponentteamlogourl,
    matchdatetime,
    stadium,
    competition,
    ishomematch = true,
    description,
    homescore = 0,
    awayscore = 0,
    status = "upcoming",
  } = req.body;

  if (!opponentteam)
    return res.status(400).json({ message: "Missing required fields" });

  try {
    const result = await pool.query(
      `INSERT INTO matches (
         opponentteam, opponentteamlogourl, matchdatetime, stadium, competition,
         ishomematch, description, homescore, awayscore, status
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING matchid`,
      [
        opponentteam,
        opponentteamlogourl === "" ? null : opponentteamlogourl,
        matchdatetime || null,
        stadium || null,
        competition || null,
        ishomematch,
        description || null,
        homescore,
        awayscore,
        status,
      ]
    );
    res.status(201).json({ matchId: result.rows[0].matchid });
  } catch (err) {
    console.error("createMatch error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/matches/:id
exports.updateMatch = async (req, res) => {
  const id = Number(req.params.id);
  const {
    opponentteam,
    opponentteamlogourl,
    matchdatetime,
    stadium,
    competition,
    ishomematch,
    description,
    homescore,
    awayscore,
    status,
  } = req.body;
  try {
    const result = await pool.query(
      `UPDATE matches
       SET opponentteam=$1,
           opponentteamlogourl=$2,
           matchdatetime=$3,
           stadium=$4,
           competition=$5,
           ishomematch=$6,
           description=$7,
           homescore=$8,
           awayscore=$9,
           status=$10
       WHERE matchid=$11
       RETURNING
  matchid,
  opponentteam,
  opponentteamlogourl,
  to_char(matchdatetime, 'YYYY-MM-DD"T"HH24:MI:SS') AS matchdatetime,
  stadium,
  competition,
  ishomematch,
  description,
  homescore,
  awayscore,
  status
`,
      [
        opponentteam,
        opponentteamlogourl === "" ? null : opponentteamlogourl,
        matchdatetime || null,
        stadium || null,
        competition || null,
        ishomematch,
        description || null,
        homescore,
        awayscore,
        status,
        id,
      ]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: "Match not found" });
    res.json({ success: true, match: result.rows[0] });
  } catch (err) {
    console.error("updateMatch error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/matches/current — chỉ trả trận đang live
exports.getCurrentMatch = async (req, res) => {
  try {
    const sql = `
      SELECT *
      FROM matches
      WHERE LOWER(COALESCE(status, '')) = 'live'
      ORDER BY matchdatetime ASC NULLS LAST
      LIMIT 1
    `;
    const result = await pool.query(sql);
    if (result.rows.length === 0) {
      return res.json({ match: null });
    }
    res.json({ match: result.rows[0] });
  } catch (err) {
    console.error("getCurrentMatch error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// PATCH /api/matches/:id/score — cập nhật tỉ số nhanh (và optional status)
exports.updateScore = async (req, res) => {
  const id = Number(req.params.id);
  const { homescore, awayscore, status } = req.body;
  if (homescore == null || awayscore == null)
    return res
      .status(400)
      .json({ message: "homescore & awayscore are required" });

  const fields = ["homescore", "awayscore"];
  const values = [homescore, awayscore];
  if (status) {
    fields.push("status");
    values.push(status);
  }
  const sets = fields.map((f, i) => `${f}=$${i + 1}`).join(", ");

  try {
    const result = await pool.query(
      `UPDATE matches SET ${sets} WHERE matchid=$${
        values.length + 1
      } RETURNING matchid, homescore, awayscore, status`,
      [...values, id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: "Match not found" });
    res.json({ success: true, match: result.rows[0] });
  } catch (err) {
    console.error("updateScore error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE giữ nguyên
exports.deleteMatch = async (req, res) => {
  const matchId = Number(req.params.id);
  if (!matchId) return res.status(400).json({ message: "Invalid match id" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const tRes = await client.query(
      "SELECT ticketid FROM tickets WHERE matchid = $1",
      [matchId]
    );
    const ticketIds = tRes.rows.map((r) => r.ticketid);

    if (ticketIds.length > 0) {
      await client.query(
        "DELETE FROM ticketorderdetails WHERE ticketid = ANY($1::int[])",
        [ticketIds]
      );
      await client.query("DELETE FROM tickets WHERE matchid = $1", [matchId]);
    }

    await client.query("DELETE FROM matches WHERE matchid = $1", [matchId]);

    await client.query("COMMIT");
    return res.json({ message: "Match deleted" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Delete match error:", err);
    return res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};
