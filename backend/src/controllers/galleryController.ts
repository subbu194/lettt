import type { RequestHandler } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import { GalleryImage } from "../models/GalleryImage";
import { AppError } from "../middleware/errorHandler";

const createImageSchema = z.object({
  imageUrl: z.string().url("Must be a valid image URL"),
  category: z.string().trim().min(1).optional().default("General"),
});

const listQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(50).optional().default(20),
  category: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(["createdAt"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─────────────────────────────────────────────────────────────
// PUBLIC: List gallery images with pagination and filtering
// ─────────────────────────────────────────────────────────────

export const listGalleryImages: RequestHandler = async (req, res, next) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const { page, limit, category, search, sortBy, sortOrder } = query;

    const filter: Record<string, unknown> = {};

    if (category) {
      filter.category = new RegExp(`^${escapeRegex(category)}$`, "i");
    }

    if (search) {
      const safe = escapeRegex(search);
      filter.$or = [{ category: { $regex: safe, $options: "i" } }];
    }

    const skip = (page - 1) * limit;
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    const [items, total] = await Promise.all([
      GalleryImage.find(filter)
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(limit)
        .lean(),
      GalleryImage.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// PUBLIC: Get all categories
// ─────────────────────────────────────────────────────────────

export const getCategories: RequestHandler = async (_req, res, next) => {
  try {
    const categories = await GalleryImage.distinct("category");
    return res.json({ categories: categories.sort() });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN: Upload single gallery image
// ─────────────────────────────────────────────────────────────

export const createGalleryImage: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      throw new AppError("Forbidden: Admin access required", 403);
    }

    const payload = createImageSchema.parse(req.body);

    const created = await GalleryImage.create({
      ...payload,
      createdBy: req.user.userId,
    });

    return res.status(201).json({
      message: "Gallery image added successfully",
      item: created,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN: Bulk upload gallery images
// ─────────────────────────────────────────────────────────────

export const bulkCreateGalleryImages: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      throw new AppError("Forbidden: Admin access required", 403);
    }

    const { images } = req.body as {
      images: { imageUrl: string; category?: string }[];
    };

    if (!Array.isArray(images) || images.length === 0) {
      throw new AppError("At least one image is required", 400);
    }

    if (images.length > 20) {
      throw new AppError("Maximum 20 images per batch", 400);
    }

    const docs = images.map((img) => ({
      imageUrl: img.imageUrl,
      category: img.category?.trim() || "General",
      createdBy: req.user!.userId,
    }));

    const created = await GalleryImage.insertMany(docs);

    return res.status(201).json({
      message: `${created.length} gallery images added successfully`,
      items: created,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN: Delete gallery image
// ─────────────────────────────────────────────────────────────

export const deleteGalleryImage: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      throw new AppError("Forbidden: Admin access required", 403);
    }

    const { id } = req.params;
    if (!id || !isValidObjectId(id)) {
      throw new AppError("Invalid image ID format", 400);
    }

    // Find the image first to get its URL for R2 deletion
    const imageToDelete = await GalleryImage.findById(id);
    if (!imageToDelete) throw new AppError("Gallery image not found", 404);

    const deleted = await GalleryImage.findByIdAndDelete(id);

    if (deleted && deleted.imageUrl) {
      // Import missing dynamically or at top. Using dynamic to avoid circular dependencies potentially, or top if we can.
      // Wait, let's just use the utils function
      const { deleteFileFromR2 } = await import("../utils/fileUpload");
      try {
        await deleteFileFromR2(deleted.imageUrl);
      } catch (r2Error) {
        console.error("Failed to delete from R2, but DB record removed:", r2Error);
        // We still return success since the DB record is gone, but we log the R2 issue
      }
    }

    return res.json({ message: "Gallery image deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN: Bulk delete gallery images
// ─────────────────────────────────────────────────────────────

export const bulkDeleteGalleryImages: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      throw new AppError("Forbidden: Admin access required", 403);
    }

    const { ids } = req.body as { ids: string[] };

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError("At least one image ID is required", 400);
    }

    if (ids.length > 50) {
      throw new AppError("Maximum 50 images per batch delete", 400);
    }

    const validIds = ids.filter((id) => isValidObjectId(id));
    
    // Get URLs before deleting from DB
    const imagesToDelete = await GalleryImage.find({ _id: { $in: validIds } });
    
    const result = await GalleryImage.deleteMany({ _id: { $in: validIds } });

    // Attempt to delete from R2 in background
    if (imagesToDelete.length > 0) {
      const { deleteFileFromR2 } = await import("../utils/fileUpload");
      Promise.all(imagesToDelete.map(async (img) => {
        try {
          if (img.imageUrl) await deleteFileFromR2(img.imageUrl);
        } catch (e) {
          console.error(`Failed to delete ${img.imageUrl} from R2:`, e);
        }
      })).catch(console.error); // Catch any unexpected Promise.all errors
    }

    return res.json({
      message: `${result.deletedCount} gallery images deleted successfully`,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN: Gallery stats
// ─────────────────────────────────────────────────────────────

export const getGalleryStats: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      throw new AppError("Forbidden: Admin access required", 403);
    }

    const [totalImages, categories] = await Promise.all([
      GalleryImage.countDocuments(),
      GalleryImage.distinct("category").then((c) => c.length),
    ]);

    return res.json({
      totalImages,
      totalCategories: categories,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN: Get categories with image counts
// ─────────────────────────────────────────────────────────────

export const getCategoriesWithCounts: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      throw new AppError("Forbidden: Admin access required", 403);
    }

    const categoryCounts = await GalleryImage.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          count: 1,
        },
      },
      {
        $sort: { category: 1 },
      },
    ]);

    return res.json({
      categories: categoryCounts,
    });
  } catch (err) {
    next(err);
  }
};
