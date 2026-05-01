import type { RequestHandler } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import { Artist } from "../models/Artist";
import { AppError } from "../middleware/errorHandler";

// ─────────────────────────────────────────────────────────────
// Validation Schemas
// ─────────────────────────────────────────────────────────────

const createArtistSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  image: z.string().url("Image must be a valid URL").optional(),
  artType: z.string().min(2, "Art type must be at least 2 characters"),
  grade: z.string().min(2, "Grade must be at least 2 characters"),
  phone: z.string().min(10, "Phone must be at least 10 characters"),
  whatsapp: z.string().min(10, "WhatsApp number must be at least 10 characters"),
  bio: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  featured: z.boolean().optional().default(false),
});

const updateArtistSchema = createArtistSchema.partial();

const listQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(50).optional().default(12),
  search: z.string().optional(),
  artType: z.string().optional(),
  grade: z.string().optional(),
  featured: z.coerce.boolean().optional(),
  active: z.coerce.boolean().optional().default(true),
  sortBy: z.enum(["createdAt", "name", "grade", "artType"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

// ─────────────────────────────────────────────────────────────
// Helper: Validate MongoDB ObjectId
// ─────────────────────────────────────────────────────────────

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

// ─────────────────────────────────────────────────────────────
// Controller: List Artists
// ─────────────────────────────────────────────────────────────

export const listArtists: RequestHandler = async (req, res, next) => {
  try {
    const query = listQuerySchema.parse(req.query);

    const filter: Record<string, unknown> = {};
    if (query.active !== undefined) filter.isActive = query.active;
    if (query.artType) filter.artType = new RegExp(query.artType, "i");
    if (query.grade) filter.grade = new RegExp(query.grade, "i");
    if (query.featured !== undefined) filter.featured = query.featured;

    // Text search
    if (query.search) {
      filter.$text = { $search: query.search };
    }

    const sortOption: Record<string, 1 | -1> = {};
    sortOption[query.sortBy] = query.sortOrder === "asc" ? 1 : -1;

    const skip = (query.page - 1) * query.limit;

    const [total, items] = await Promise.all([
      Artist.countDocuments(filter),
      Artist.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(query.limit)
        .select("-createdBy"),
    ]);

    const totalPages = Math.ceil(total / query.limit);

    res.json({
      items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
        hasNext: query.page < totalPages,
        hasPrev: query.page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// Controller: Get Featured Artists
// ─────────────────────────────────────────────────────────────

export const getFeaturedArtists: RequestHandler = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 6;

    const items = await Artist.find({ isActive: true, featured: true })
      .sort({ createdAt: "desc" })
      .limit(limit)
      .select("-createdBy");

    res.json({ items });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// Controller: Get Artist By ID
// ─────────────────────────────────────────────────────────────

export const getArtistById: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      throw new AppError("Invalid artist ID", 400);
    }

    const artist = await Artist.findById(id).select("-createdBy");

    if (!artist) {
      throw new AppError("Artist not found", 404);
    }

    res.json({ item: artist });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// Controller: Create Artist (Admin)
// ─────────────────────────────────────────────────────────────

export const createArtist: RequestHandler = async (req, res, next) => {
  try {
    const data = createArtistSchema.parse(req.body);

    const artist = await Artist.create({
      ...data,
      createdBy: req.user?._id,
    });

    res.status(201).json({ item: artist });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// Controller: Update Artist (Admin)
// ─────────────────────────────────────────────────────────────

export const updateArtist: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = updateArtistSchema.parse(req.body);

    if (!isValidObjectId(id)) {
      throw new AppError("Invalid artist ID", 400);
    }

    const artist = await Artist.findByIdAndUpdate(
      id,
      data,
      { new: true, runValidators: true }
    ).select("-createdBy");

    if (!artist) {
      throw new AppError("Artist not found", 404);
    }

    res.json({ item: artist });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// Controller: Delete Artist (Admin)
// ─────────────────────────────────────────────────────────────

export const deleteArtist: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      throw new AppError("Invalid artist ID", 400);
    }

    const artist = await Artist.findByIdAndDelete(id);

    if (!artist) {
      throw new AppError("Artist not found", 404);
    }

    res.json({ message: "Artist deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// Controller: Toggle Artist Availability (Admin)
// ─────────────────────────────────────────────────────────────

export const toggleArtistAvailability: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      throw new AppError("Invalid artist ID", 400);
    }

    const artist = await Artist.findById(id);

    if (!artist) {
      throw new AppError("Artist not found", 404);
    }

    artist.isActive = !artist.isActive;
    await artist.save();

    res.json({ item: artist });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// Controller: Toggle Artist Featured (Admin)
// ─────────────────────────────────────────────────────────────

export const toggleArtistFeatured: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      throw new AppError("Invalid artist ID", 400);
    }

    const artist = await Artist.findById(id);

    if (!artist) {
      throw new AppError("Artist not found", 404);
    }

    artist.featured = !artist.featured;
    await artist.save();

    res.json({ item: artist });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// Controller: Get Artist Stats (Admin)
// ─────────────────────────────────────────────────────────────

export const getArtistStats: RequestHandler = async (req, res, next) => {
  try {
    const total = await Artist.countDocuments();
    const active = await Artist.countDocuments({ isActive: true });
    const featured = await Artist.countDocuments({ featured: true });
    const byGrade = await Artist.aggregate([
      { $group: { _id: "$grade", count: { $sum: 1 } } },
    ]);

    res.json({
      stats: {
        total,
        active,
        featured,
        byGrade,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// Controller: Seed Sample Artist Data (Dev Only)
// ─────────────────────────────────────────────────────────────

export const seedArtists: RequestHandler = async (req, res, next) => {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === "production") {
      throw new AppError(" seeding not allowed in production", 403);
    }

    // Clear existing
    await Artist.deleteMany({});

    const sampleArtists = [
      {
        name: "Arjun Sharma",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
        artType: "Oil Painting",
        grade: "Expert",
        phone: "+91 98765 43210",
        whatsapp: "+91 98765 43210",
        bio: "Award-winning oil painter with 15+ years of experience specializing in contemporary Indian art.",
        featured: true,
      },
      {
        name: "Priya Patel",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face",
        artType: "Watercolor",
        grade: "Advanced",
        phone: "+91 87654 32109",
        whatsapp: "+91 87654 32109",
        bio: "Watercolor artist known for vibrant landscapes and botanical illustrations.",
        featured: true,
      },
      {
        name: "Rahul Verma",
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face",
        artType: "Digital Art",
        grade: "Expert",
        phone: "+91 76543 21098",
        whatsapp: "+91 76543 21098",
        bio: "Digital artist creating stunning concept art and illustrations for global clients.",
        featured: true,
      },
      {
        name: "Meera Reddy",
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
        artType: "Sculpture",
        grade: "Intermediate",
        phone: "+91 65432 10987",
        whatsapp: "+91 65432 10987",
        bio: "Sculptor working with marble and bronze, creating contemporary figurative pieces.",
        featured: false,
      },
      {
        name: "Amit Singh",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
        artType: "Acrylic",
        grade: "Advanced",
        phone: "+91 54321 09876",
        whatsapp: "+91 54321 09876",
        bio: "Acrylic painter focusing on abstract expressions and modern art themes.",
        featured: false,
      },
      {
        name: "Sneha Kapoor",
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face",
        artType: "Charcoal",
        grade: "Beginner",
        phone: "+91 43210 98765",
        whatsapp: "+91 43210 98765",
        bio: "Charcoal artist exploring the depths of light and shadow in portraiture.",
        featured: false,
      },
    ];

    const created = await Artist.insertMany(sampleArtists);

    res.json({
      message: `Successfully seeded ${created.length} artists`,
      count: created.length,
    });
  } catch (error) {
    next(error);
  }
};
