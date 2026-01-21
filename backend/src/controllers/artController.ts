import type { RequestHandler } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import { Art } from "../models/Art";
import { AppError } from "../middleware/errorHandler";

// ─────────────────────────────────────────────────────────────
// Validation Schemas
// ─────────────────────────────────────────────────────────────

const frameSizeSchema = z.object({
  name: z.string().min(1),
  width: z.number().min(0),
  height: z.number().min(0),
  unit: z.enum(['cm', 'inch']).default('cm'),
});

const createArtSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  artist: z.string().min(2, "Artist name must be at least 2 characters"),
  images: z.array(z.string().url("Each image must be a valid URL")).min(1, "At least one image is required").max(10, "Maximum 10 images allowed"),
  frameSizes: z.array(frameSizeSchema).min(1, "At least one frame size is required"),
  price: z.number().min(0, "Price must be positive"),
  quantity: z.number().int().min(0, "Quantity must be a positive integer").default(1),
  category: z.string().optional(),
  isFeatured: z.boolean().optional().default(false),
  isAvailable: z.boolean().optional().default(true),
});

const updateArtSchema = createArtSchema.partial();

const listQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(50).optional().default(12),
  category: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  search: z.string().optional(),
  sortBy: z.enum(["createdAt", "price", "title"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  featured: z.coerce.boolean().optional(),
  available: z.coerce.boolean().optional(),
});

// ─────────────────────────────────────────────────────────────
// Helper: Validate MongoDB ObjectId
// ─────────────────────────────────────────────────────────────

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

// ─────────────────────────────────────────────────────────────
// PUBLIC: List art with pagination, filtering, and search
// ─────────────────────────────────────────────────────────────

export const listArt: RequestHandler = async (req, res, next) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const { page, limit, category, minPrice, maxPrice, search, sortBy, sortOrder, featured, available } = query;

    // Build filter object
    const filter: Record<string, unknown> = {};
    
    if (category) filter.category = category;
    if (featured !== undefined) filter.isFeatured = featured;
    if (available !== undefined) filter.isAvailable = available;
    
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) (filter.price as Record<string, number>).$gte = minPrice;
      if (maxPrice !== undefined) (filter.price as Record<string, number>).$lte = maxPrice;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { artist: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    const [items, total] = await Promise.all([
      Art.find(filter)
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(limit)
        .lean(),
      Art.countDocuments(filter),
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
// PUBLIC: List featured art (for homepage)
// ─────────────────────────────────────────────────────────────

export const listFeaturedArt: RequestHandler = async (_req, res, next) => {
  try {
    const items = await Art.find({ isFeatured: true, isAvailable: true })
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();
    return res.json({ items });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// PUBLIC: Get single art by ID
// ─────────────────────────────────────────────────────────────

export const getArtById: RequestHandler = async (req, res, next) => {
  try {
    const id = req.params.id;
    
    if (!id || !isValidObjectId(id)) {
      throw new AppError("Invalid art ID format", 400);
    }

    const item = await Art.findById(id).lean();
    if (!item) throw new AppError("Art not found", 404);

    // Get related art (same category or artist)
    const related = await Art.find({
      _id: { $ne: id },
      isAvailable: true,
      $or: [
        { category: item.category },
        { artist: item.artist },
      ],
    })
      .limit(4)
      .lean();

    return res.json({ item, related });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// PUBLIC: Get all unique categories
// ─────────────────────────────────────────────────────────────

export const getCategories: RequestHandler = async (_req, res, next) => {
  try {
    const categories = await Art.distinct("category", { 
      category: { $nin: [null, ""] } 
    });
    return res.json({ categories: categories.filter(Boolean) });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN: Create new art
// ─────────────────────────────────────────────────────────────

export const createArt: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      throw new AppError("Forbidden: Admin access required", 403);
    }

    const payload = createArtSchema.parse(req.body);
    const created = await Art.create({ ...payload, createdBy: req.user.userId });

    return res.status(201).json({ 
      message: "Art created successfully",
      item: created 
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN: Update existing art
// ─────────────────────────────────────────────────────────────

export const updateArt: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      throw new AppError("Forbidden: Admin access required", 403);
    }

    const { id } = req.params;
    if (!id || !isValidObjectId(id)) {
      throw new AppError("Invalid art ID format", 400);
    }

    const payload = updateArtSchema.parse(req.body);
    
    const updated = await Art.findByIdAndUpdate(
      id,
      { $set: payload },
      { new: true, runValidators: true }
    );

    if (!updated) throw new AppError("Art not found", 404);

    return res.json({ 
      message: "Art updated successfully",
      item: updated 
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN: Delete art
// ─────────────────────────────────────────────────────────────

export const deleteArt: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      throw new AppError("Forbidden: Admin access required", 403);
    }

    const { id } = req.params;
    if (!id || !isValidObjectId(id)) {
      throw new AppError("Invalid art ID format", 400);
    }

    const deleted = await Art.findByIdAndDelete(id);
    if (!deleted) throw new AppError("Art not found", 404);

    return res.json({ message: "Art deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN: Toggle featured status
// ─────────────────────────────────────────────────────────────

export const toggleFeatured: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      throw new AppError("Forbidden: Admin access required", 403);
    }

    const { id } = req.params;
    if (!id || !isValidObjectId(id)) {
      throw new AppError("Invalid art ID format", 400);
    }

    const art = await Art.findById(id);
    if (!art) throw new AppError("Art not found", 404);

    art.isFeatured = !art.isFeatured;
    await art.save();

    return res.json({ 
      message: `Art ${art.isFeatured ? "featured" : "unfeatured"} successfully`,
      item: art 
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN: Toggle availability
// ─────────────────────────────────────────────────────────────

export const toggleAvailability: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      throw new AppError("Forbidden: Admin access required", 403);
    }

    const { id } = req.params;
    if (!id || !isValidObjectId(id)) {
      throw new AppError("Invalid art ID format", 400);
    }

    const art = await Art.findById(id);
    if (!art) throw new AppError("Art not found", 404);

    art.isAvailable = !art.isAvailable;
    await art.save();

    return res.json({ 
      message: `Art ${art.isAvailable ? "available" : "unavailable"} successfully`,
      item: art 
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN: Get art statistics
// ─────────────────────────────────────────────────────────────

export const getArtStats: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      throw new AppError("Forbidden: Admin access required", 403);
    }

    const [total, featured, available, byCategory] = await Promise.all([
      Art.countDocuments(),
      Art.countDocuments({ isFeatured: true }),
      Art.countDocuments({ isAvailable: true }),
      Art.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return res.json({
      stats: {
        total,
        featured,
        available,
        unavailable: total - available,
        byCategory: byCategory.map((c) => ({ category: c._id || "Uncategorized", count: c.count })),
      },
    });
  } catch (err) {
    next(err);
  }
};
