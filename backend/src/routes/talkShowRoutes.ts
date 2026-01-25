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
router.get("/:id", getVideoById);

// ─────────────────────────────────────────────────────────────
// Admin Routes
// ─────────────────────────────────────────────────────────────
router.post("/", authenticateAdmin, createVideo);
router.put("/:id", authenticateAdmin, updateVideo);
router.delete("/:id", authenticateAdmin, deleteVideo);
router.post("/:id/toggle-featured", authenticateAdmin, toggleFeatured);
router.get("/admin/stats", authenticateAdmin, getVideoStats);

export default router;
