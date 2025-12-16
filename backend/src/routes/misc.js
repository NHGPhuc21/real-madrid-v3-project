const express = require("express");
const router = express.Router();
const db = require("../../config/db.js");

router.get("/productcategories", async (req, res) => {
  try {
    const r = await db.query(
      "SELECT categoryid, categoryname FROM productcategories ORDER BY categoryid"
    );
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ message: "error" });
  }
});

router.get("/ticketcategories", async (req, res) => {
  try {
    const r = await db.query(
      "SELECT categoryid, categoryname, price FROM ticketcategories ORDER BY categoryid"
    );
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ message: "error" });
  }
});

module.exports = router;
