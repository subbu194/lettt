import { Router } from "express";
import {
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
router.get("/:id", getArtById);

// ─────────────────────────────────────────────────────────────
// Admin Routes (require authentication)
// ─────────────────────────────────────────────────────────────
router.post("/", authenticateAdmin, createArt);
router.put("/:id", authenticateAdmin, updateArt);
router.delete("/:id", authenticateAdmin, deleteArt);
router.patch("/:id/toggle-featured", authenticateAdmin, toggleFeatured);
router.patch("/:id/toggle-availability", authenticateAdmin, toggleAvailability);
router.get("/admin/stats", authenticateAdmin, getArtStats);

export default router;
