// backend/src/controllers/myticketscontroller.js
const pool = require("../../config/db");

exports.listMyTickets = async (req, res) => {
  try {
    const userId = req.user.userId;
    const r = await pool.query(
      `SELECT t.ticketid, tc.categoryname, m.opponentteam, m.matchdatetime,
              tod.quantity, tod.unitprice, tod.subtotal, tod.qrcode, o.orderid, 
              o.orderdate, o.paymentstatus, o.orderstatus, o.totalamount
       FROM ticketorderdetails tod
       JOIN ticketorders o ON o.orderid = tod.orderid
       JOIN tickets t ON t.ticketid = tod.ticketid
       JOIN ticketcategories tc ON tc.categoryid = t.categoryid
       JOIN matches m ON m.matchid = t.matchid
       WHERE o.userid=$1
       ORDER BY o.orderdate DESC`,
      [userId]
    );
    res.json(r.rows);
  } catch (err) {
    console.error("listMyTickets error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
