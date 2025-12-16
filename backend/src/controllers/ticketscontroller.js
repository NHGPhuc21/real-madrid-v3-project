// backend/src/controllers/ticketscontroller.js
const pool = require("../../config/db");

const ticketsController = {
  getAllTickets: async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT t.ticketid, t.matchid, t.categoryid, t.totalquantity, t.availablequantity,
               t.salestartdate, t.saleenddate,
               m.opponentteam, m.matchdatetime,
               tc.categoryname, tc.price as categoryprice
        FROM tickets t
        JOIN matches m ON t.matchid = m.matchid
        JOIN ticketcategories tc ON t.categoryid = tc.categoryid
        ORDER BY t.ticketid ASC
      `);
      res.json(result.rows);
    } catch (err) {
      console.error("getAllTickets error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  getTicketById: async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT * FROM tickets WHERE ticketid = $1",
        [req.params.id]
      );
      if (result.rows.length === 0)
        return res.status(404).json({ message: "Ticket not found" });
      res.json(result.rows[0]);
    } catch (err) {
      console.error("getTicketById error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  createTicket: async (req, res) => {
    try {
      const {
        matchid,
        categoryid,
        totalquantity,
        availablequantity,
        salestartdate,
        saleenddate,
      } = req.body;

      if (!matchid || !categoryid || totalquantity == null)
        return res.status(400).json({ message: "Missing required fields" });

      const result = await pool.query(
        `INSERT INTO tickets (matchid, categoryid, totalquantity, availablequantity, salestartdate, saleenddate)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [
          matchid,
          categoryid,
          totalquantity,
          availablequantity ?? totalquantity,
          salestartdate || null,
          saleenddate || null,
        ]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error("createTicket error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  updateTicket: async (req, res) => {
    try {
      const {
        matchid,
        categoryid,
        totalquantity,
        availablequantity,
        salestartdate,
        saleenddate,
      } = req.body;

      const result = await pool.query(
        `UPDATE tickets
         SET matchid=$1, categoryid=$2, totalquantity=$3, availablequantity=$4,
             salestartdate=$5, saleenddate=$6, update_at=NOW()
         WHERE ticketid=$7 RETURNING *`,
        [
          matchid,
          categoryid,
          totalquantity,
          availablequantity,
          salestartdate || null,
          saleenddate || null,
          req.params.id,
        ]
      );

      if (result.rows.length === 0)
        return res.status(404).json({ message: "Ticket not found" });

      res.json(result.rows[0]);
    } catch (err) {
      console.error("updateTicket error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  deleteTicket: async (req, res) => {
    try {
      const result = await pool.query("DELETE FROM tickets WHERE ticketid=$1", [
        req.params.id,
      ]);
      if (result.rowCount === 0)
        return res.status(404).json({ message: "Ticket not found" });
      res.json({ message: "Ticket deleted" });
    } catch (err) {
      console.error("deleteTicket error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  getUpcomingTicketsForUser: async (req, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const result = await pool.query(
        `
      SELECT 
        t.ticketid, t.matchid, t.categoryid, t.totalquantity, t.availablequantity,
        t.salestartdate, t.saleenddate,
        m.opponentteam, m.matchdatetime, m.stadium, m.competition,
        tc.categoryname, tc.price as categoryprice
      FROM tickets t
      JOIN matches m ON t.matchid = m.matchid
      JOIN ticketcategories tc ON t.categoryid = tc.categoryid
      WHERE (m.matchdatetime IS NULL OR m.matchdatetime >= NOW())
      ORDER BY m.matchdatetime ASC NULLS LAST
      `
      );

      res.json(result.rows);
    } catch (err) {
      console.error("getUpcomingTicketsForUser error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // ⭐⭐⭐ NEW: GET TICKETS BY MATCH ⭐⭐⭐
  getByMatch: async (req, res) => {
    try {
      const { matchId } = req.params;

      const q = `
        SELECT 
          t.ticketid, t.matchid, t.categoryid, t.totalquantity, t.availablequantity,
          c.categoryname, c.price
        FROM tickets t
        JOIN ticketcategories c ON c.categoryid = t.categoryid
        WHERE t.matchid = $1
        ORDER BY c.price ASC
      `;

      const result = await pool.query(q, [matchId]);
      return res.json(result.rows);
    } catch (err) {
      console.error("getByMatch error:", err);
      return res.status(500).json({ error: "Failed to load tickets by match" });
    }
  },
};

module.exports = ticketsController;
