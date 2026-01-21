import { Router } from "express";
import {
  createEvent,
  deleteEvent,
  getEventById,
  getEventStats,
  getVenues,
  listEvents,
  listFeaturedEvents,
  listUpcomingEvents,
  toggleFeatured,
  updateEvent,
} from "../controllers/eventController";
import { authenticateAdmin } from "../middleware/auth";

const router = Router();

// ─────────────────────────────────────────────────────────────
// Public Routes
// ─────────────────────────────────────────────────────────────
router.get("/", listEvents);
router.get("/featured", listFeaturedEvents);
router.get("/upcoming", listUpcomingEvents);
router.get("/venues", getVenues);
router.get("/:id", getEventById);

// ─────────────────────────────────────────────────────────────
// Admin Routes (require authentication)
// ─────────────────────────────────────────────────────────────
router.post("/", authenticateAdmin, createEvent);
router.put("/:id", authenticateAdmin, updateEvent);
router.delete("/:id", authenticateAdmin, deleteEvent);
router.patch("/:id/toggle-featured", authenticateAdmin, toggleFeatured);
router.get("/admin/stats", authenticateAdmin, getEventStats);

export default router;
