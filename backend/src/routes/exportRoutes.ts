import { Router } from "express";
import { 
  exportOrders,
  exportTicketBookings,
  exportTickets,
  exportArt,
  exportEvents,
  exportUsers,
} from "../controllers/exportController";
import { authenticateAdmin } from "../middleware/auth";

const router = Router();

// All export routes require admin authentication
router.get("/art-orders", authenticateAdmin, exportOrders);
router.get("/ticket-bookings", authenticateAdmin, exportTicketBookings);
router.get("/tickets", authenticateAdmin, exportTickets);
router.get("/art", authenticateAdmin, exportArt);
router.get("/events", authenticateAdmin, exportEvents);
router.get("/users", authenticateAdmin, exportUsers);

export default router;
