import { Router } from "express";
import { z } from "zod";
import {
  createArtist,
  deleteArtist,
  getArtistById,
  getArtistStats,
  listArtists,
  seedArtists,
  toggleArtistAvailability,
  toggleArtistFeatured,
  getFeaturedArtists,
  updateArtist,
} from "../controllers/artistController";
import { authenticateAdmin, authenticateUser } from "../middleware/auth";

const router = Router();

const updateArtistSchema = z.object({
  name: z.string().min(2).optional(),
  image: z.string().url().optional().or(z.literal("")),
  artType: z.string().min(2).optional(),
  grade: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  whatsapp: z.string().min(10).optional(),
  bio: z.string().optional(),
  isActive: z.boolean().optional(),
  featured: z.boolean().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided",
});

// ─────────────────────────────────────────────────────────────
// Public Routes
// ─────────────────────────────────────────────────────────────
router.get("/", listArtists);
router.get("/featured", getFeaturedArtists);
router.get("/:id", getArtistById);

// ─────────────────────────────────────────────────────────────
// Admin Routes (require authentication)
// ─────────────────────────────────────────────────────────────
router.post("/", authenticateAdmin, createArtist);
router.put("/:id", authenticateAdmin, (req, res, next) => {
  try {
    const validated = updateArtistSchema.parse(req.body);
    req.body = validated;
    return updateArtist(req, res, next);
  } catch (err) {
    next(err);
  }
});
router.delete("/:id", authenticateAdmin, deleteArtist);
router.patch("/:id/toggle-availability", authenticateAdmin, toggleArtistAvailability);
router.patch("/:id/toggle-featured", authenticateAdmin, toggleArtistFeatured);
router.get("/admin/stats", authenticateAdmin, getArtistStats);

// Dev only - seed sample data
router.post("/seed", seedArtists);

export default router;
