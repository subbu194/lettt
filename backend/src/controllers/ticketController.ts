import type { RequestHandler } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import { AppError } from "../middleware/errorHandler";
import { Ticket } from "../models/Ticket";
import { Event } from "../models/Event";

// ─────────────────────────────────────────────────────────────
// Validation Schemas
// ─────────────────────────────────────────────────────────────

const listQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(50).optional().default(10),
  status: z.enum(["active", "used", "cancelled", "expired"]).optional(),
});

const adminQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  status: z.enum(["active", "used", "cancelled", "expired"]).optional(),
  search: z.string().optional(),
  eventId: z.string().optional(),
  sortBy: z.enum(["createdAt", "eventDate"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

// ─────────────────────────────────────────────────────────────
// USER: Get my tickets with pagination
// ─────────────────────────────────────────────────────────────

export const myTickets: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    
    const { page, limit, status } = listQuerySchema.parse(req.query);
    const skip = (page - 1) * limit;
    
    const filter: Record<string, unknown> = { userId: req.user.userId };
    if (status) filter.status = status;
    
    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("eventId", "title date startTime venue coverImage")
        .lean(),
      Ticket.countDocuments(filter),
    ]);
    
    const totalPages = Math.ceil(total / limit);
    
    // Enhance tickets with event info and status check
    const enhancedTickets = tickets.map(ticket => {
      const event = ticket.eventId as unknown as { 
        title: string; 
        date: Date; 
        startTime: string; 
        venue: string; 
        coverImage: string;
      } | null;
      
      let effectiveStatus = ticket.status;
      if (event && ticket.status === "active") {
        const eventDate = new Date(event.date);
        if (eventDate < new Date()) {
          effectiveStatus = "expired";
        }
      }
      
      return {
        ...ticket,
        effectiveStatus,
      };
    });
    
    return res.json({ 
      tickets: enhancedTickets,
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
// USER: Get single ticket details
// ─────────────────────────────────────────────────────────────

export const getTicketById: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    
    const { id } = req.params;
    
    const ticket = await Ticket.findOne({ 
      _id: id, 
      userId: req.user.userId 
    })
      .populate("eventId", "title description date startTime venue coverImage ticketPrice")
      .populate("orderId", "totalAmount createdAt bookingStatus bookingNumber")
      .lean();
    
    if (!ticket) throw new AppError("Ticket not found", 404);
    
    const event = ticket.eventId as unknown as { date: Date } | null;
    let effectiveStatus = ticket.status;
    if (event && ticket.status === "active") {
      const eventDate = new Date(event.date);
      if (eventDate < new Date()) {
        effectiveStatus = "expired";
      }
    }
    
    return res.json({ 
      ticket: {
        ...ticket,
        effectiveStatus,
      }
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// USER: Get ticket by ticket ID (for QR scanning)
// ─────────────────────────────────────────────────────────────

export const getTicketByTicketId: RequestHandler = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    
    const ticket = await Ticket.findOne({ ticketId })
      .populate("eventId", "title date startTime venue")
      .populate("userId", "name email")
      .lean();
    
    if (!ticket) throw new AppError("Ticket not found", 404);
    
    return res.json({ ticket });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN: List all tickets with filtering
// ─────────────────────────────────────────────────────────────

export const adminListTickets: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      throw new AppError("Forbidden: Admin access required", 403);
    }
    
    const { page, limit, status, search, eventId, sortBy, sortOrder } = adminQuerySchema.parse(req.query);
    const skip = (page - 1) * limit;
    
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
      filter.eventId = new mongoose.Types.ObjectId(eventId);
    }
    if (search) {
      filter.ticketId = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    }
    
    const sortDirection = sortOrder === "asc" ? 1 : -1;
    
    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(limit)
        .populate("eventId", "title date startTime venue")
        .populate("userId", "name email")
        .lean(),
      Ticket.countDocuments(filter),
    ]);
    
    const totalPages = Math.ceil(total / limit);
    
    return res.json({ 
      tickets,
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
// ADMIN: Mark ticket as used (for entry validation)
// ─────────────────────────────────────────────────────────────

export const markTicketUsed: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      throw new AppError("Forbidden: Admin access required", 403);
    }
    
    const { ticketId } = req.params;
    
    const ticket = await Ticket.findOne({ ticketId });
    if (!ticket) throw new AppError("Ticket not found", 404);
    
    if (ticket.status === "used") {
      throw new AppError("Ticket has already been used", 400);
    }
    
    if (ticket.status === "cancelled") {
      throw new AppError("Ticket has been cancelled", 400);
    }
    
    // Check if event has passed
    const event = await Event.findById(ticket.eventId);
    if (!event) throw new AppError("Associated event not found", 404);
    
    const eventDate = new Date(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    
    if (eventDate < today) {
      throw new AppError("Event has already passed", 400);
    }
    
    ticket.status = "used";
    await ticket.save();
    
    return res.json({ 
      success: true, 
      message: "Ticket marked as used",
      ticket: {
        ticketId: ticket.ticketId,
        status: ticket.status,
        quantity: ticket.quantity,
      }
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN: Cancel ticket (with optional refund note)
// ─────────────────────────────────────────────────────────────

export const cancelTicket: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      throw new AppError("Forbidden: Admin access required", 403);
    }
    
    const { id } = req.params;
    
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid ticket ID", 400);
    }
    
    const ticket = await Ticket.findById(id);
    if (!ticket) throw new AppError("Ticket not found", 404);
    
    if (ticket.status === "cancelled") {
      throw new AppError("Ticket is already cancelled", 400);
    }
    
    if (ticket.status === "used") {
      throw new AppError("Cannot cancel a used ticket", 400);
    }
    
    // Restore seats to event
    await Event.updateOne(
      { _id: ticket.eventId },
      { $inc: { seatsLeft: ticket.quantity } }
    );
    
    ticket.status = "cancelled";
    await ticket.save();
    
    return res.json({ 
      success: true, 
      message: "Ticket cancelled. Seats have been restored to inventory.",
      ticket: {
        _id: ticket._id,
        ticketId: ticket.ticketId,
        status: ticket.status,
      }
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN: Get ticket statistics
// ─────────────────────────────────────────────────────────────

export const getTicketStats: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      throw new AppError("Forbidden: Admin access required", 403);
    }
    
    const [
      totalTickets,
      activeTickets,
      usedTickets,
      cancelledTickets,
      ticketsByEvent,
    ] = await Promise.all([
      Ticket.countDocuments(),
      Ticket.countDocuments({ status: "active" }),
      Ticket.countDocuments({ status: "used" }),
      Ticket.countDocuments({ status: "cancelled" }),
      Ticket.aggregate([
        { 
          $lookup: {
            from: "events",
            localField: "eventId",
            foreignField: "_id",
            as: "event"
          }
        },
        { $unwind: "$event" },
        {
          $group: {
            _id: "$eventId",
            eventTitle: { $first: "$event.title" },
            eventDate: { $first: "$event.date" },
            totalTickets: { $sum: 1 },
            totalQuantity: { $sum: "$quantity" },
            activeCount: { 
              $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } 
            },
            usedCount: { 
              $sum: { $cond: [{ $eq: ["$status", "used"] }, 1, 0] } 
            },
          }
        },
        { $sort: { eventDate: -1 } },
        { $limit: 10 },
      ]),
    ]);
    
    return res.json({
      stats: {
        totalTickets,
        activeTickets,
        usedTickets,
        cancelledTickets,
        expiredTickets: totalTickets - activeTickets - usedTickets - cancelledTickets,
      },
      ticketsByEvent,
    });
  } catch (err) {
    next(err);
  }
};
