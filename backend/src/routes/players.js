const express = require("express");
const router = express.Router();
const players = require("../controllers/playerscontroller");

// ============ PLAYERS BASE ============
router.get("/", players.listPlayers);
router.get("/:id", players.getPlayer);
router.post("/", players.createPlayer);
router.put("/:id", players.updatePlayer);
router.delete("/:id", players.deletePlayer);

// ============ CAREER ============
router.get("/:id/career", players.listCareerByPlayer);
router.post("/:id/career", players.createCareer);
router.put("/:id/career/:careerId", players.updateCareer);
router.delete("/:id/career/:careerId", players.deleteCareer);

// ============ TRANSFERS ============
router.get("/:id/transfers", players.listTransfers);
router.post("/:id/transfers", players.createTransfer);
router.put("/:id/transfers/:tid", players.updateTransfer);
router.delete("/:id/transfers/:tid", players.deleteTransfer);

// ============ INJURIES ============
router.get("/:id/injuries", players.listInjuries);
router.post("/:id/injuries", players.createInjury);
router.put("/:id/injuries/:iid", players.updateInjury);
router.delete("/:id/injuries/:iid", players.deleteInjury);

module.exports = router;
