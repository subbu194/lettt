import type { RequestHandler } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import { TalkShowVideo } from "../models/TalkShowVideo";
import { AppError } from "../middleware/errorHandler";

// ─────────────────────────────────────────────────────────────
// Validation Schemas
// ─────────────────────────────────────────────────────────────

const createVideoSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  youtubeUrl: z.string().url("Must be a valid YouTube URL"),
  season: z.number().min(1, "Season must be at least 1"),
  episodeNumber: z.number().min(1).optional(),
  duration: z.string().optional(),
  isFeatured: z.boolean().optional().default(false),
});

const updateVideoSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").optional(),
  description: z.string().min(10, "Description must be at least 10 characters").optional(),
  youtubeUrl: z.string().url("Must be a valid YouTube URL").optional(),
  season: z.number().min(1, "Season must be at least 1").optional(),
  episodeNumber: z.number().min(1).optional(),
  duration: z.string().optional(),
  isFeatured: z.boolean().optional(),
});

const listQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(50).optional().default(12),
  season: z.coerce.number().optional(),
  featured: z.coerce.boolean().optional(),
  sortBy: z.enum(["createdAt", "season", "episodeNumber", "title"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

// Helper function to extract YouTube video ID from URL
// Handles: watch?v=, youtu.be/, /embed/, /shorts/, /live/, /v/
function extractYouTubeId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:shorts\/|live\/|v\/|embed\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] ?? null : null;
}

// Helper function to generate YouTube thumbnail URL
// Uses hqdefault (480x360) which is guaranteed to exist for every video
function getYouTubeThumbnail(url: string): string | null {
  const videoId = extractYouTubeId(url);
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
}

// ─────────────────────────────────────────────────────────────
// PUBLIC: List videos with pagination and filtering
// ─────────────────────────────────────────────────────────────

export const listVideos: RequestHandler = async (req, res, next) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const { page, limit, season, featured, sortBy, sortOrder } = query;

    // Build filter object
    const filter: Record<string, unknown> = {};
    
    if (season !== undefined) filter.season = season;
    if (featured !== undefined) filter.isFeatured = featured;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    const [items, total] = await Promise.all([
      TalkShowVideo.find(filter)
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(limit)
        .lean(),
      TalkShowVideo.countDocuments(filter),
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
// PUBLIC: Get all seasons
// ─────────────────────────────────────────────────────────────

export const getSeasons: RequestHandler = async (_req, res, next) => {
  try {
    const seasons = await TalkShowVideo.distinct("season");
    return res.json({ seasons: seasons.sort((a, b) => a - b) });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// PUBLIC: Get single video by ID
// ─────────────────────────────────────────────────────────────

export const getVideoById: RequestHandler = async (req, res, next) => {
  try {
    const id = req.params.id;
    
    if (!id || !isValidObjectId(id)) {
      throw new AppError("Invalid video ID format", 400);
    }

    const video = await TalkShowVideo.findById(id).lean();
    
    if (!video) {
      throw new AppError("Video not found", 404);
    }

    return res.json({ item: video });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN: Create new video
// ─────────────────────────────────────────────────────────────

export const createVideo: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      throw new AppError("Forbidden: Admin access required", 403);
    }

    const payload = createVideoSchema.parse(req.body);
    
    // Auto-generate thumbnail from YouTube URL
    const thumbnail = getYouTubeThumbnail(payload.youtubeUrl);
    
    const created = await TalkShowVideo.create({ 
      ...payload, 
      thumbnail: thumbnail ?? undefined,
      createdBy: req.user.userId 
    });

    return res.status(201).json({ 
      message: "Video created successfully",
      item: created 
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN: Update existing video
// ─────────────────────────────────────────────────────────────

export const updateVideo: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      throw new AppError("Forbidden: Admin access required", 403);
    }

    const { id } = req.params;
    if (!id || !isValidObjectId(id)) {
      throw new AppError("Invalid video ID format", 400);
    }

    const payload = updateVideoSchema.parse(req.body);
    const updateData: Record<string, unknown> = { ...payload };

    // Regenerate YouTube thumbnail when URL changes
    if (payload.youtubeUrl) {
      updateData.thumbnail = getYouTubeThumbnail(payload.youtubeUrl) ?? undefined;
    }

    // Remove undefined keys so they don't overwrite existing values
    for (const key of Object.keys(updateData)) {
      if (updateData[key] === undefined) delete updateData[key];
    }

    const updated = await TalkShowVideo.findByIdAndUpdate(
      id,
      { $set: updateData },
      { returnDocument: 'after', runValidators: true }
    );

    if (!updated) throw new AppError("Video not found", 404);

    return res.json({ 
      message: "Video updated successfully",
      item: updated 
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN: Delete video
// ─────────────────────────────────────────────────────────────

export const deleteVideo: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      throw new AppError("Forbidden: Admin access required", 403);
    }

    const { id } = req.params;
    if (!id || !isValidObjectId(id)) {
      throw new AppError("Invalid video ID format", 400);
    }

    const deleted = await TalkShowVideo.findByIdAndDelete(id);
    
    if (!deleted) throw new AppError("Video not found", 404);

    return res.json({ message: "Video deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN: Get video stats
// ─────────────────────────────────────────────────────────────

export const getVideoStats: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      throw new AppError("Forbidden: Admin access required", 403);
    }

    const [totalVideos, totalSeasons, featuredCount] = await Promise.all([
      TalkShowVideo.countDocuments(),
      TalkShowVideo.distinct("season").then(s => s.length),
      TalkShowVideo.countDocuments({ isFeatured: true }),
    ]);

    return res.json({
      totalVideos,
      totalSeasons,
      featuredCount,
    });
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
      throw new AppError("Invalid video ID format", 400);
    }

    const video = await TalkShowVideo.findById(id);
    if (!video) throw new AppError("Video not found", 404);

    video.isFeatured = !video.isFeatured;
    await video.save();

    return res.json({ 
      message: `Video ${video.isFeatured ? 'featured' : 'unfeatured'} successfully`,
      item: video 
    });
  } catch (err) {
    next(err);
  }
};
