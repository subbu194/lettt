import { Router } from "express";
import { 
  myTickets,
  getTicketById,
  getTicketByTicketId,
  adminListTickets,
  markTicketUsed,
  cancelTicket,
  getTicketStats,
} from "../controllers/ticketController";
import { authenticateAdmin, authenticateUser } from "../middleware/auth";

const router = Router();

// ─────────────────────────────────────────────────────────────
// User routes
// ─────────────────────────────────────────────────────────────
router.get("/my-tickets", authenticateUser, myTickets);
router.get("/my-tickets/:id", authenticateUser, getTicketById);
router.get("/validate/:ticketId", authenticateAdmin, getTicketByTicketId);

// ─────────────────────────────────────────────────────────────
// Admin routes
// ─────────────────────────────────────────────────────────────
router.get("/admin", authenticateAdmin, adminListTickets);
router.get("/admin/stats", authenticateAdmin, getTicketStats);
router.patch("/admin/use/:ticketId", authenticateAdmin, markTicketUsed);
router.patch("/admin/cancel/:id", authenticateAdmin, cancelTicket);

export default router;
