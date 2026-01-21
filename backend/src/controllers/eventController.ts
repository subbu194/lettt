import type { RequestHandler } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import { Event } from "../models/Event";
import { AppError } from "../middleware/errorHandler";

// ─────────────────────────────────────────────────────────────
// Validation Schemas
// ─────────────────────────────────────────────────────────────

const createEventSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  coverImage: z.string().url("Cover image must be a valid URL"),
  galleryImages: z.array(z.string().url("Each gallery image must be a valid URL")).max(10, "Maximum 10 gallery images allowed").default([]),
  venue: z.string().min(2, "Venue must be at least 2 characters"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date format"),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:MM format"),
  ticketPrice: z.number().min(0, "Ticket price must be positive"),
  totalSeats: z.number().min(1, "Must have at least 1 seat"),
  seatsLeft: z.number().min(0).optional(),
  isFeatured: z.boolean().optional().default(false),
});

const updateEventSchema = createEventSchema.partial();

const listQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(50).optional().default(12),
  venue: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  search: z.string().optional(),
  sortBy: z.enum(["date", "ticketPrice", "title", "createdAt"]).optional().default("date"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
  featured: z.coerce.boolean().optional(),
  upcoming: z.coerce.boolean().optional(),
  available: z.coerce.boolean().optional(),
});

// ─────────────────────────────────────────────────────────────
// Helper: Validate MongoDB ObjectId
// ─────────────────────────────────────────────────────────────

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

// ─────────────────────────────────────────────────────────────
// PUBLIC: List events with pagination, filtering, and search
// ─────────────────────────────────────────────────────────────

export const listEvents: RequestHandler = async (req, res, next) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const { page, limit, venue, minPrice, maxPrice, search, sortBy, sortOrder, featured, upcoming, available } = query;

    // Build filter object
    const filter: Record<string, unknown> = {};
    
    if (venue) filter.venue = { $regex: venue, $options: "i" };
    if (featured !== undefined) filter.isFeatured = featured;
    
    // Filter for events with available seats
    if (available) filter.seatsLeft = { $gt: 0 };

    // Filter for upcoming events (date >= today)
    if (upcoming) {
      const today = new Date().toISOString().split("T")[0];
      filter.date = { $gte: today };
    }
    
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.ticketPrice = {};
      if (minPrice !== undefined) (filter.ticketPrice as Record<string, number>).$gte = minPrice;
      if (maxPrice !== undefined) (filter.ticketPrice as Record<string, number>).$lte = maxPrice;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { venue: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    const [items, total] = await Promise.all([
      Event.find(filter)
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(limit)
        .lean(),
      Event.countDocuments(filter),
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
// PUBLIC: List featured events (for homepage)
// ─────────────────────────────────────────────────────────────

export const listFeaturedEvents: RequestHandler = async (_req, res, next) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const items = await Event.find({ 
      isFeatured: true,
      date: { $gte: today },
      seatsLeft: { $gt: 0 },
    })
      .sort({ date: 1 })
      .limit(8)
      .lean();
    return res.json({ items });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// PUBLIC: List upcoming events
// ─────────────────────────────────────────────────────────────

export const listUpcomingEvents: RequestHandler = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 6, 20);
    const today = new Date().toISOString().split("T")[0];
    
    const items = await Event.find({ 
      date: { $gte: today },
      seatsLeft: { $gt: 0 },
    })
      .sort({ date: 1 })
      .limit(limit)
      .lean();
    
    return res.json({ items });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// PUBLIC: Get single event by ID
// ─────────────────────────────────────────────────────────────

export const getEventById: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!id || !isValidObjectId(id)) {
      throw new AppError("Invalid event ID format", 400);
    }

    const item = await Event.findById(id).lean();
    if (!item) throw new AppError("Event not found", 404);

    // Get related events (same venue or nearby dates)
    const related = await Event.find({
      _id: { $ne: id },
      seatsLeft: { $gt: 0 },
      $or: [
        { venue: item.venue },
      ],
    })
      .sort({ date: 1 })
      .limit(4)
      .lean();

    return res.json({ item, related });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// PUBLIC: Get all unique venues
// ─────────────────────────────────────────────────────────────

export const getVenues: RequestHandler = async (_req, res, next) => {
  try {
    const venues = await Event.distinct("venue");
    return res.json({ venues: venues.filter(Boolean) });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN: Create new event
// ─────────────────────────────────────────────────────────────

export const createEvent: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      throw new AppError("Forbidden: Admin access required", 403);
    }

    const payload = createEventSchema.parse(req.body);
    const initialSeatsLeft = payload.seatsLeft ?? payload.totalSeats;
    
    const created = await Event.create({ 
      ...payload, 
      seatsLeft: initialSeatsLeft, 
      createdBy: req.user.userId 
    });

    return res.status(201).json({ 
      message: "Event created successfully",
      item: created 
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN: Update existing event
// ─────────────────────────────────────────────────────────────

export const updateEvent: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      throw new AppError("Forbidden: Admin access required", 403);
    }

    const { id } = req.params;
    if (!id || !isValidObjectId(id)) {
      throw new AppError("Invalid event ID format", 400);
    }

    const payload = updateEventSchema.parse(req.body);
    
    // If totalSeats is being updated and it's increasing, adjust seatsLeft proportionally
    if (payload.totalSeats !== undefined) {
      const existing = await Event.findById(id);
      if (existing && payload.totalSeats > existing.totalSeats) {
        const diff = payload.totalSeats - existing.totalSeats;
        payload.seatsLeft = existing.seatsLeft + diff;
      }
    }

    const updated = await Event.findByIdAndUpdate(
      id,
      { $set: payload },
      { new: true, runValidators: true }
    );

    if (!updated) throw new AppError("Event not found", 404);

    return res.json({ 
      message: "Event updated successfully",
      item: updated 
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN: Delete event
// ─────────────────────────────────────────────────────────────

export const deleteEvent: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      throw new AppError("Forbidden: Admin access required", 403);
    }

    const { id } = req.params;
    if (!id || !isValidObjectId(id)) {
      throw new AppError("Invalid event ID format", 400);
    }

    const deleted = await Event.findByIdAndDelete(id);
    if (!deleted) throw new AppError("Event not found", 404);

    return res.json({ message: "Event deleted successfully" });
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
      throw new AppError("Invalid event ID format", 400);
    }

    const event = await Event.findById(id);
    if (!event) throw new AppError("Event not found", 404);

    event.isFeatured = !event.isFeatured;
    await event.save();

    return res.json({ 
      message: `Event ${event.isFeatured ? "featured" : "unfeatured"} successfully`,
      item: event 
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN: Get event statistics
// ─────────────────────────────────────────────────────────────

export const getEventStats: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      throw new AppError("Forbidden: Admin access required", 403);
    }

    const today = new Date().toISOString().split("T")[0];

    const [total, featured, upcoming, soldOut, totalSeats, totalSold, byVenue] = await Promise.all([
      Event.countDocuments(),
      Event.countDocuments({ isFeatured: true }),
      Event.countDocuments({ date: { $gte: today } }),
      Event.countDocuments({ seatsLeft: 0 }),
      Event.aggregate([{ $group: { _id: null, total: { $sum: "$totalSeats" } } }]),
      Event.aggregate([{ $group: { _id: null, sold: { $sum: { $subtract: ["$totalSeats", "$seatsLeft"] } } } }]),
      Event.aggregate([
        { $group: { _id: "$venue", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    return res.json({
      stats: {
        total,
        featured,
        upcoming,
        past: total - upcoming,
        soldOut,
        totalSeats: totalSeats[0]?.total || 0,
        ticketsSold: totalSold[0]?.sold || 0,
        byVenue: byVenue.map((v) => ({ venue: v._id, count: v.count })),
      },
    });
  } catch (err) {
    next(err);
  }
};
