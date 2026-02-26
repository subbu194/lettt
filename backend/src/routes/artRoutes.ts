import { Router } from "express";
import {
  artAutocomplete,
  bulkDeleteArt,
  createArt,
  deleteArt,
  getArtById,
  getArtStats,
  getCategories,
  listArt,
  listFeaturedArt,
  toggleAvailability,
  toggleFeatured,
  updateArt,
} from "../controllers/artController";
import { authenticateAdmin, authenticateUser } from "../middleware/auth";

const router = Router();

// ─────────────────────────────────────────────────────────────
// Public Routes
// ─────────────────────────────────────────────────────────────
router.get("/", listArt);
router.get("/featured", listFeaturedArt);
router.get("/categories", getCategories);
router.get("/autocomplete", artAutocomplete);

// ─────────────────────────────────────────────────────────────
// Admin Routes (require authentication)
// ─────────────────────────────────────────────────────────────
// NOTE: static admin paths must come BEFORE the /:id wildcard
router.get("/admin/stats", authenticateAdmin, getArtStats);
router.post("/", authenticateAdmin, createArt);
router.post("/bulk-delete", authenticateAdmin, bulkDeleteArt);

// Wildcard param route – must be last among GETs
router.get("/:id", getArtById);
router.put("/:id", authenticateAdmin, updateArt);
router.delete("/:id", authenticateAdmin, deleteArt);
router.patch("/:id/toggle-featured", authenticateAdmin, toggleFeatured);
router.patch("/:id/toggle-availability", authenticateAdmin, toggleAvailability);

export default router;
