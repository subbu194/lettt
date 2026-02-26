import { Router } from "express";
import {
  bulkDeleteEvents,
  createEvent,
  deleteEvent,
  eventAutocomplete,
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
router.get("/autocomplete", eventAutocomplete);

// ─────────────────────────────────────────────────────────────
// Admin Routes (require authentication)
// ─────────────────────────────────────────────────────────────
// NOTE: static admin paths must come BEFORE the /:id wildcard
router.get("/admin/stats", authenticateAdmin, getEventStats);
router.post("/", authenticateAdmin, createEvent);
router.post("/bulk-delete", authenticateAdmin, bulkDeleteEvents);

// Wildcard param route – must be last among GETs
router.get("/:id", getEventById);
router.put("/:id", authenticateAdmin, updateEvent);
router.delete("/:id", authenticateAdmin, deleteEvent);
router.patch("/:id/toggle-featured", authenticateAdmin, toggleFeatured);

export default router;
