import { Router } from "express";
import {
  adminListBlogs,
  createBlog,
  deleteBlog,
  getBlogById,
  getBlogBySlug,
  getBlogStats,
  listBlogs,
  listFeaturedBlogs,
  toggleFeatured,
  togglePublished,
  updateBlog,
} from "../controllers/blogController";
import { authenticateAdmin } from "../middleware/auth";

const router = Router();

// ─────────────────────────────────────────────────────────────
// Public Routes
// ─────────────────────────────────────────────────────────────

// GET /api/v1/blogs              → paginated published list
router.get("/", listBlogs);

// GET /api/v1/blogs/featured     → featured blogs (max 6)
router.get("/featured", listFeaturedBlogs);

// GET /api/v1/blogs/slug/:slug   → full blog by slug
router.get("/slug/:slug", getBlogBySlug);

// ─────────────────────────────────────────────────────────────
// Admin Routes
// ─────────────────────────────────────────────────────────────

// GET /api/v1/blogs/admin/all    → all blogs including drafts
router.get("/admin/all", authenticateAdmin, adminListBlogs);

// GET /api/v1/blogs/admin/stats
router.get("/admin/stats", authenticateAdmin, getBlogStats);

// POST /api/v1/blogs             → create new blog
router.post("/", authenticateAdmin, createBlog);

// GET /api/v1/blogs/:id          → get by ID (admin uses this for the editor)
router.get("/:id", authenticateAdmin, getBlogById);

// PUT /api/v1/blogs/:id
router.put("/:id", authenticateAdmin, updateBlog);

// DELETE /api/v1/blogs/:id
router.delete("/:id", authenticateAdmin, deleteBlog);

// PATCH /api/v1/blogs/:id/toggle-published
router.patch("/:id/toggle-published", authenticateAdmin, togglePublished);

// PATCH /api/v1/blogs/:id/toggle-featured
router.patch("/:id/toggle-featured", authenticateAdmin, toggleFeatured);

export default router;
