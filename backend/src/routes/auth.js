// backend/src/routes/auth.js
const express = require("express");
const router = express.Router();
const authCtrl = require("../controllers/authcontroller");

// Public
router.post("/register", authCtrl.register);
router.post("/login", authCtrl.login);

// Optional: logout ở FE là xoá token nên BE không cần endpoint.
// router.post("/logout", (req,res)=> res.json({message:"ok"}));

module.exports = router;
