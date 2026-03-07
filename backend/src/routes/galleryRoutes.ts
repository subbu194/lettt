import { Router } from "express";
import {
  listGalleryImages,
  getCategories,
  createGalleryImage,
  bulkCreateGalleryImages,
  deleteGalleryImage,
  bulkDeleteGalleryImages,
  getGalleryStats,
} from "../controllers/galleryController";
import { authenticateAdmin } from "../middleware/auth";

const router = Router();

// Public Routes
router.get("/", listGalleryImages);
router.get("/categories", getCategories);

// Admin Routes
router.get("/admin/stats", authenticateAdmin, getGalleryStats);
router.post("/", authenticateAdmin, createGalleryImage);
router.post("/bulk", authenticateAdmin, bulkCreateGalleryImages);
router.delete("/bulk", authenticateAdmin, bulkDeleteGalleryImages);
router.delete("/:id", authenticateAdmin, deleteGalleryImage);

export default router;
