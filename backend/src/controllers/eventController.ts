import type { RequestHandler } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import { Event } from "../models/Event";
import { Ticket } from "../models/Ticket";
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
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date format").transform((val) => new Date(val)),
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

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
    
    if (venue) filter.venue = { $regex: escapeRegex(venue), $options: "i" };
    if (featured !== undefined) filter.isFeatured = featured;
    
    // Filter for events with available seats
    if (available) filter.seatsLeft = { $gt: 0 };

    // Filter for upcoming events (date >= today)
    if (upcoming) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today
      filter.date = { $gte: today };
    }
    
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.ticketPrice = {};
      if (minPrice !== undefined) (filter.ticketPrice as Record<string, number>).$gte = minPrice;
      if (maxPrice !== undefined) (filter.ticketPrice as Record<string, number>).$lte = maxPrice;
    }

    if (search) {
      const safe = escapeRegex(search);
      filter.$or = [
        { title: { $regex: safe, $options: "i" } },
        { venue: { $regex: safe, $options: "i" } },
        { description: { $regex: safe, $options: "i" } },
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
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
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
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
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
// PUBLIC: Get all unique venues with pagination
// ─────────────────────────────────────────────────────────────

const venuesQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  search: z.string().optional(),
});

export const getVenues: RequestHandler = async (req, res, next) => {
  try {
    const { page, limit, search } = venuesQuerySchema.parse(req.query);
    
    // Build filter
    const filter: Record<string, unknown> = {};
    
    if (search) {
      filter.venue = { 
        $regex: escapeRegex(search), 
        $options: "i" 
      };
    }
    
    const venues = await Event.distinct("venue", filter);
    const filteredVenues = venues.filter(Boolean).sort();
    
    // Apply pagination
    const skip = (page - 1) * limit;
    const total = filteredVenues.length;
    const paginatedVenues = filteredVenues.slice(skip, skip + limit);
    const totalPages = Math.ceil(total / limit);
    
    return res.json({ 
      venues: paginatedVenues,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      }
    });
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
    
    // If totalSeats is being updated, adjust seatsLeft proportionally
    if (payload.totalSeats !== undefined) {
      const existing = await Event.findById(id);
      if (existing && payload.totalSeats !== existing.totalSeats) {
        const diff = payload.totalSeats - existing.totalSeats;
        const newSeatsLeft = existing.seatsLeft + diff;
        
        // Prevent reducing total seats below the amount of tickets already sold
        if (newSeatsLeft < 0) {
          throw new AppError(`Cannot reduce total seats below already sold tickets`, 400);
        }
        
        payload.seatsLeft = newSeatsLeft;
      }
    }

    const updated = await Event.findByIdAndUpdate(
      id,
      { $set: payload },
      { returnDocument: 'after', runValidators: true }
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

    // Get the event details BEFORE deleting so we can clean up R2 Storage
    const eventToDelete = await Event.findById(id);
    if (!eventToDelete) throw new AppError("Event not found", 404);

    const deleted = await Event.findByIdAndDelete(id);

    // Clean up associated tickets — cancel any active tickets for this event
    const ticketCleanup = await Ticket.updateMany(
      { eventId: id, status: "active" },
      { $set: { status: "cancelled" } }
    );
    if (ticketCleanup.modifiedCount > 0) {
      console.warn(`Cancelled ${ticketCleanup.modifiedCount} active tickets for deleted event ${id}`);
    }

    // Automatically wipe all associated images from R2 Storage
    if (deleted) {
      const { deleteFileFromR2 } = await import("../utils/fileUpload");
      const urlsToDelete: string[] = [];

      if (deleted.coverImage) urlsToDelete.push(deleted.coverImage);
      
      if (Array.isArray(deleted.galleryImages)) {
        deleted.galleryImages.forEach((url) => {
          if (url) urlsToDelete.push(url);
        });
      }

      if (urlsToDelete.length > 0) {
        Promise.all(urlsToDelete.map(async (url) => {
          try {
            await deleteFileFromR2(url);
          } catch (e) {
            console.error(`Failed to delete event image ${url} from R2:`, e);
          }
        })).catch(console.error);
      }
    }

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
// ADMIN: Bulk delete events
// ─────────────────────────────────────────────────────────────

const bulkDeleteSchema = z.object({
  ids: z.array(z.string().refine(isValidObjectId, "Invalid ID format")).min(1, "At least one ID required").max(50, "Maximum 50 items at once"),
});

export const bulkDeleteEvents: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      throw new AppError("Forbidden: Admin access required", 403);
    }

    const { ids } = bulkDeleteSchema.parse(req.body);
    
    // Get the event details BEFORE deleting so we can clean up R2 Storage
    const eventsToDelete = await Event.find({ _id: { $in: ids } });

    // Delete all events with the provided IDs
    const result = await Event.deleteMany({ _id: { $in: ids } });
    
    // Attempt to delete all associated images from R2 in background
    if (eventsToDelete.length > 0) {
      const { deleteFileFromR2 } = await import("../utils/fileUpload");
      const urlsToDelete: string[] = [];
      
      eventsToDelete.forEach(event => {
        if (event.coverImage) urlsToDelete.push(event.coverImage);
        
        if (Array.isArray(event.galleryImages)) {
          event.galleryImages.forEach(url => {
            if (url) urlsToDelete.push(url);
          });
        }
      });

      if (urlsToDelete.length > 0) {
        Promise.all(urlsToDelete.map(async (url) => {
          try {
            await deleteFileFromR2(url);
          } catch (e) {
            console.error(`Failed to delete event image ${url} from R2:`, e);
          }
        })).catch(console.error);
      }
    }

    return res.json({ 
      message: `Successfully deleted ${result.deletedCount} event(s)`,
      deletedCount: result.deletedCount
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

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

// ─────────────────────────────────────────────────────────────
// PUBLIC: Search autocomplete for events
// ─────────────────────────────────────────────────────────────

const autocompleteSchema = z.object({
  q: z.string().min(1, "Search query required"),
  limit: z.coerce.number().min(1).max(20).optional().default(10),
});

export const eventAutocomplete: RequestHandler = async (req, res, next) => {
  try {
    const { q, limit } = autocompleteSchema.parse(req.query);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const safe = escapeRegex(q);
    
    // Search in titles and venues for upcoming events only
    const results = await Event.find({
      $or: [
        { title: { $regex: safe, $options: "i" } },
        { venue: { $regex: safe, $options: "i" } },
      ],
      date: { $gte: today },
      seatsLeft: { $gt: 0 },
    })
      .select("title venue date ticketPrice coverImage")
      .sort({ date: 1 })
      .limit(limit)
      .lean();
    
    // Format results for autocomplete
    const suggestions = results.map(item => ({
      id: item._id,
      title: item.title,
      venue: item.venue,
      date: item.date,
      price: item.ticketPrice,
      image: item.coverImage || null,
      type: 'event' as const,
    }));
    
    return res.json({ suggestions });
  } catch (err) {
    next(err);
  }
};
