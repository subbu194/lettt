import { Router } from "express";
import {
  createTicketBooking,
  verifyTicketBooking,
  myTicketBookings,
  getTicketBookingById,
  adminListTicketBookings,
  getTicketBookingStats,
} from "../controllers/ticketBookingController";
import { authenticateAdmin, authenticateUser } from "../middleware/auth";

const router = Router();

// ─────────────────────────────────────────────────────────────
// User routes
// ─────────────────────────────────────────────────────────────
router.post("/create", authenticateUser, createTicketBooking);
router.post("/verify", authenticateUser, verifyTicketBooking);
router.get("/my-bookings", authenticateUser, myTicketBookings);
router.get("/my-bookings/:id", authenticateUser, getTicketBookingById);

// ─────────────────────────────────────────────────────────────
// Admin routes
// ─────────────────────────────────────────────────────────────
router.get("/admin", authenticateAdmin, adminListTicketBookings);
router.get("/admin/stats", authenticateAdmin, getTicketBookingStats);

export default router;
