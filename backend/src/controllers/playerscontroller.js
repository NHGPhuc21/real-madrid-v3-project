const pool = require("../../config/db");

// ========= Helper ==========
function toIntOrNull(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? null : n;
}

const playersController = {
  // ===================== CAREER =====================
  listCareerByPlayer: async (req, res) => {
    try {
      const playerId = +req.params.id;
      if (!playerId)
        return res.status(400).json({ message: "Invalid player id" });

      const r = await pool.query(
        `SELECT id, season, appearances, goals, assists,
                yellowcards, redcards, category
         FROM PlayerCareer
         WHERE playerid = $1
         ORDER BY season DESC, id DESC`,
        [playerId]
      );

      res.json(r.rows);
    } catch (err) {
      console.error("listCareerByPlayer:", err);
      res.status(500).json({ error: err.message });
    }
  },

  createCareer: async (req, res) => {
    try {
      const playerId = +req.params.id;

      const {
        season,
        appearances,
        goals,
        assists,
        category,
        yellowcards,
        redcards,
      } = req.body;

      const cat = category || "league";

      const r = await pool.query(
        `INSERT INTO PlayerCareer
         (playerid, season, appearances, goals, assists,
          yellowcards, redcards, category)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING *`,
        [
          playerId,
          season || null,
          toIntOrNull(appearances),
          toIntOrNull(goals),
          toIntOrNull(assists),
          toIntOrNull(yellowcards),
          toIntOrNull(redcards),
          cat,
        ]
      );

      res.status(201).json(r.rows[0]);
    } catch (err) {
      console.error("createCareer:", err);
      res.status(500).json({ error: err.message });
    }
  },

  updateCareer: async (req, res) => {
    try {
      const playerId = +req.params.id;
      const careerId = +req.params.careerId;

      const {
        season,
        appearances,
        goals,
        assists,
        category,
        yellowcards,
        redcards,
      } = req.body;

      const r = await pool.query(
        `UPDATE PlayerCareer
         SET season      = COALESCE($1, season),
             appearances = COALESCE($2, appearances),
             goals       = COALESCE($3, goals),
             assists     = COALESCE($4, assists),
             yellowcards = COALESCE($5, yellowcards),
             redcards    = COALESCE($6, redcards),
             category    = COALESCE($7, category)
         WHERE id = $8 AND playerid = $9
         RETURNING *`,
        [
          season || null,
          appearances !== undefined ? toIntOrNull(appearances) : null,
          goals !== undefined ? toIntOrNull(goals) : null,
          assists !== undefined ? toIntOrNull(assists) : null,
          yellowcards !== undefined ? toIntOrNull(yellowcards) : null,
          redcards !== undefined ? toIntOrNull(redcards) : null,
          category || null,
          careerId,
          playerId,
        ]
      );

      if (!r.rows.length)
        return res.status(404).json({ message: "Career not found" });

      res.json(r.rows[0]);
    } catch (err) {
      console.error("updateCareer:", err);
      res.status(500).json({ error: err.message });
    }
  },

  deleteCareer: async (req, res) => {
    try {
      const r = await pool.query(
        `DELETE FROM PlayerCareer WHERE id = $1 AND playerid = $2`,
        [+req.params.careerId, +req.params.id]
      );

      if (!r.rowCount)
        return res.status(404).json({ message: "Career not found" });

      res.json({ message: "Career deleted" });
    } catch (err) {
      console.error("deleteCareer:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // ===================== TRANSFERS =====================
  listTransfers: async (req, res) => {
    try {
      const r = await pool.query(
        `SELECT id, year, fromclub, toclub
         FROM PlayerTransfers
         WHERE playerid = $1
         ORDER BY year DESC, id DESC`,
        [+req.params.id]
      );
      res.json(r.rows);
    } catch (err) {
      console.error("listTransfers:", err);
      res.status(500).json({ error: err.message });
    }
  },

  createTransfer: async (req, res) => {
    try {
      const { year, fromclub, toclub } = req.body;

      const r = await pool.query(
        `INSERT INTO PlayerTransfers (playerid, year, fromclub, toclub)
         VALUES ($1,$2,$3,$4)
         RETURNING *`,
        [+req.params.id, year || null, fromclub || null, toclub || null]
      );

      res.status(201).json(r.rows[0]);
    } catch (err) {
      console.error("createTransfer:", err);
      res.status(500).json({ error: err.message });
    }
  },

  updateTransfer: async (req, res) => {
    try {
      const { year, fromclub, toclub } = req.body;

      const r = await pool.query(
        `UPDATE PlayerTransfers
         SET year     = COALESCE($1, year),
             fromclub = COALESCE($2, fromclub),
             toclub   = COALESCE($3, toclub)
         WHERE id = $4 AND playerid = $5
         RETURNING *`,
        [
          year || null,
          fromclub || null,
          toclub || null,
          +req.params.tid,
          +req.params.id,
        ]
      );

      if (!r.rows.length)
        return res.status(404).json({ message: "Transfer not found" });

      res.json(r.rows[0]);
    } catch (err) {
      console.error("updateTransfer:", err);
      res.status(500).json({ error: err.message });
    }
  },

  deleteTransfer: async (req, res) => {
    try {
      const r = await pool.query(
        `DELETE FROM PlayerTransfers
         WHERE id = $1 AND playerid = $2`,
        [+req.params.tid, +req.params.id]
      );

      if (!r.rowCount)
        return res.status(404).json({ message: "Transfer not found" });

      res.json({ message: "Transfer deleted" });
    } catch (err) {
      console.error("deleteTransfer:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // ===================== INJURIES =====================
  listInjuries: async (req, res) => {
    try {
      const r = await pool.query(
        `SELECT id, injury, startdate, enddate
         FROM PlayerInjuries
         WHERE playerid = $1
         ORDER BY startdate DESC, id DESC`,
        [+req.params.id]
      );
      res.json(r.rows);
    } catch (err) {
      console.error("listInjuries:", err);
      res.status(500).json({ error: err.message });
    }
  },

  createInjury: async (req, res) => {
    try {
      const { injury, startdate, enddate } = req.body;

      const r = await pool.query(
        `INSERT INTO PlayerInjuries (playerid, injury, startdate, enddate)
         VALUES ($1,$2,$3,$4)
         RETURNING *`,
        [+req.params.id, injury, startdate || null, enddate || null]
      );

      res.status(201).json(r.rows[0]);
    } catch (err) {
      console.error("createInjury:", err);
      res.status(500).json({ error: err.message });
    }
  },

  updateInjury: async (req, res) => {
    try {
      const { injury, startdate, enddate } = req.body;

      const r = await pool.query(
        `UPDATE PlayerInjuries
         SET injury    = COALESCE($1, injury),
             startdate = COALESCE($2, startdate),
             enddate   = COALESCE($3, enddate)
         WHERE id = $4 AND playerid = $5
         RETURNING *`,
        [
          injury || null,
          startdate || null,
          enddate || null,
          +req.params.iid,
          +req.params.id,
        ]
      );

      if (!r.rows.length)
        return res.status(404).json({ message: "Injury not found" });

      res.json(r.rows[0]);
    } catch (err) {
      console.error("updateInjury:", err);
      res.status(500).json({ error: err.message });
    }
  },

  deleteInjury: async (req, res) => {
    try {
      const r = await pool.query(
        `DELETE FROM PlayerInjuries
         WHERE id = $1 AND playerid = $2`,
        [+req.params.iid, +req.params.id]
      );

      if (!r.rowCount)
        return res.status(404).json({ message: "Injury not found" });

      res.json({ message: "Injury deleted" });
    } catch (err) {
      console.error("deleteInjury:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // ===================== BASE PLAYER =====================
  listPlayers: async (req, res) => {
    try {
      const r = await pool.query(
        `SELECT playerid, fullname, position, age,
                shirtnumber, birthdate,
                nationality, height, weight,
                imageurl, description
         FROM players
         ORDER BY playerid ASC`
      );
      res.json(r.rows);
    } catch (err) {
      console.error("listPlayers:", err);
      res.status(500).json({ error: err.message });
    }
  },

  getPlayer: async (req, res) => {
    try {
      const id = +req.params.id;

      const base = await pool.query(
        `SELECT *
         FROM players
         WHERE playerid = $1`,
        [id]
      );
      if (!base.rows.length)
        return res.status(404).json({ message: "Player not found" });

      const [career, transfers, injuries] = await Promise.all([
        pool.query(
          `SELECT *
           FROM PlayerCareer
           WHERE playerid = $1
           ORDER BY season DESC`,
          [id]
        ),
        pool.query(
          `SELECT *
           FROM PlayerTransfers
           WHERE playerid = $1
           ORDER BY year DESC`,
          [id]
        ),
        pool.query(
          `SELECT *
           FROM PlayerInjuries
           WHERE playerid = $1
           ORDER BY startdate DESC`,
          [id]
        ),
      ]);

      const player = base.rows[0];
      player.career = career.rows;
      player.transfers = transfers.rows;
      player.injuries = injuries.rows;

      res.json(player);
    } catch (err) {
      console.error("getPlayer:", err);
      res.status(500).json({ error: err.message });
    }
  },

  createPlayer: async (req, res) => {
    try {
      const {
        fullname,
        position,
        age,
        nationality,
        height,
        weight,
        imageurl,
        description,
        shirtnumber,
        birthdate,
      } = req.body;

      const img = imageurl || null;

      const r = await pool.query(
        `INSERT INTO players
         (fullname, position, age, shirtnumber, birthdate,
          nationality, height, weight, imageurl, description)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         RETURNING *`,
        [
          fullname,
          position || null,
          toIntOrNull(age),
          toIntOrNull(shirtnumber),
          birthdate || null,
          nationality || null,
          height || null,
          weight || null,
          img,
          description || null,
        ]
      );

      res.status(201).json(r.rows[0]);
    } catch (err) {
      console.error("createPlayer:", err);
      res.status(500).json({ error: err.message });
    }
  },

  updatePlayer: async (req, res) => {
    try {
      const id = +req.params.id;

      const {
        fullname,
        position,
        age,
        nationality,
        height,
        weight,
        imageurl,
        description,
        shirtnumber,
        birthdate,
      } = req.body;

      const img = imageurl || null;

      const r = await pool.query(
        `UPDATE players
         SET fullname    = COALESCE($1, fullname),
             position    = COALESCE($2, position),
             age         = COALESCE($3, age),
             shirtnumber = COALESCE($4, shirtnumber),
             birthdate   = COALESCE($5, birthdate),
             nationality = COALESCE($6, nationality),
             height      = COALESCE($7, height),
             weight      = COALESCE($8, weight),
             imageurl    = COALESCE($9, imageurl),
             description = COALESCE($10, description),
             updated_at  = NOW()
         WHERE playerid = $11
         RETURNING *`,
        [
          fullname || null,
          position || null,
          toIntOrNull(age),
          toIntOrNull(shirtnumber),
          birthdate || null,
          nationality || null,
          height || null,
          weight || null,
          img,
          description || null,
          id,
        ]
      );

      res.json(r.rows[0]);
    } catch (err) {
      console.error("updatePlayer:", err);
      res.status(500).json({ error: err.message });
    }
  },

  deletePlayer: async (req, res) => {
    try {
      const r = await pool.query(`DELETE FROM players WHERE playerid = $1`, [
        +req.params.id,
      ]);

      if (!r.rowCount)
        return res.status(404).json({ message: "Player not found" });

      res.json({ message: "Player deleted" });
    } catch (err) {
      console.error("deletePlayer:", err);
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = playersController;
