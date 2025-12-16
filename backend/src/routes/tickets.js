// backend/src/routes/tickets.js
const express = require("express");
const router = express.Router();
const ticketsController = require("../controllers/ticketsController");
const { authMiddleware, adminOnly } = require("../middleware/authmiddleware");


router.get(
  "/upcoming",
  authMiddleware,
  ticketsController.getUpcomingTicketsForUser
);

// Public
router.get("/by-match/:matchId", ticketsController.getByMatch);
router.get("/", ticketsController.getAllTickets);


router.get("/:id", ticketsController.getTicketById);

// Admin
router.post("/", authMiddleware, adminOnly, ticketsController.createTicket);
router.put("/:id", authMiddleware, adminOnly, ticketsController.updateTicket);
router.delete(
  "/:id",
  authMiddleware,
  adminOnly,
  ticketsController.deleteTicket
);

module.exports = router;
