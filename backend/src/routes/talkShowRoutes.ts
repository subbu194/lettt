import { Router } from "express";
import {
  createVideo,
  deleteVideo,
  getSeasons,
  getVideoById,
  getVideoStats,
  listVideos,
  toggleFeatured,
  updateVideo,
} from "../controllers/talkShowController";
import { authenticateAdmin } from "../middleware/auth";

const router = Router();

// ─────────────────────────────────────────────────────────────
// Public Routes
// ─────────────────────────────────────────────────────────────
router.get("/", listVideos);
router.get("/seasons", getSeasons);

// ─────────────────────────────────────────────────────────────
// Admin Routes
// ─────────────────────────────────────────────────────────────
// NOTE: static admin paths must come BEFORE the /:id wildcard
router.get("/admin/stats", authenticateAdmin, getVideoStats);
router.post("/", authenticateAdmin, createVideo);

// Wildcard param route – must be last among GETs
router.get("/:id", getVideoById);
router.put("/:id", authenticateAdmin, updateVideo);
router.delete("/:id", authenticateAdmin, deleteVideo);
router.post("/:id/toggle-featured", authenticateAdmin, toggleFeatured);

export default router;
