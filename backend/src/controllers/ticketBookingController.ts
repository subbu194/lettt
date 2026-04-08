import type { RequestHandler } from "express";
import { z } from "zod";
import crypto from "node:crypto";
import mongoose from "mongoose";
import { nanoid } from "nanoid";
import { AppError } from "../middleware/errorHandler";
import { getRazorpayInstance, getRazorpayKeyId } from "../utils/razorpay";
import { TicketBooking, type TicketBookingDocument } from "../models/TicketBooking";
import { Ticket } from "../models/Ticket";
import { Event } from "../models/Event";

// ─────────────────────────────────────────────────────────────
// Validation Schemas
// ─────────────────────────────────────────────────────────────

const createBookingSchema = z.object({
  eventId: z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), {
    message: "Invalid event ID",
  }),
  quantity: z.number().int().min(1).max(10),
  phone: z.string().regex(/^\d{10}$/, "Please enter a valid 10-digit phone number"),
});

const listQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(50).optional().default(10),
  status: z.enum(["created", "paid", "failed", "cancelled", "refunded"]).optional(),
});

const verifySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function safeSignatureCompare(expectedHex: string, actualHex: string): boolean {
  try {
    const expected = Buffer.from(expectedHex, "hex");
    const actual = Buffer.from(actualHex, "hex");
    if (expected.length === 0 || expected.length !== actual.length) return false;
    return crypto.timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

function toPaymentProviderError(err: unknown, fallbackMessage: string): AppError {
  const statusFromError =
    typeof (err as { statusCode?: unknown })?.statusCode === "number"
      ? Number((err as { statusCode: number }).statusCode)
      : undefined;

  const nestedDescription = (err as { error?: { description?: unknown } })?.error?.description;
  const directDescription = (err as { description?: unknown })?.description;
  const rawMessage =
    typeof nestedDescription === "string"
      ? nestedDescription
      : typeof directDescription === "string"
        ? directDescription
        : err instanceof Error
          ? err.message
          : fallbackMessage;

  const normalizedStatus =
    statusFromError && statusFromError >= 400 && statusFromError < 500 ? statusFromError : 502;

  return new AppError(rawMessage || fallbackMessage, normalizedStatus);
}

async function fulfillTicketBooking(booking: TicketBookingDocument, session: mongoose.ClientSession) {
  const eventId = booking.eventId;

  // Decrement seats
  const updateResult = await Event.findOneAndUpdate(
    {
      _id: eventId,
      seatsLeft: { $gte: booking.quantity },
    },
    { $inc: { seatsLeft: -booking.quantity } },
    {
      session,
      returnDocument: "after",
    }
  );

  if (!updateResult) {
    throw new AppError("Not enough seats left for this event.", 400);
  }

  // Create ticket
  const ticketId = `TKT-${Date.now().toString(36).toUpperCase()}-${nanoid(6).toUpperCase()}`;
  const ticket = await Ticket.create(
    [
      {
        userId: booking.userId,
        eventId,
        orderId: booking._id, // Link to booking instead of old Order
        ticketId,
        quantity: booking.quantity,
        status: "active",
      },
    ],
    { session }
  );

  return { ticketId, ticket: ticket[0] };
}

// ─────────────────────────────────────────────────────────────
// USER: Create ticket booking
// ─────────────────────────────────────────────────────────────

export const createTicketBooking: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);

    const { eventId, quantity, phone } = createBookingSchema.parse(req.body);

    // Validate event
    const event = await Event.findById(eventId);
    if (!event) throw new AppError("Event not found", 404);
    
    if (event.seatsLeft < quantity) {
      throw new AppError(`Only ${event.seatsLeft} seats left for this event`, 400);
    }

    const eventDate = new Date(event.date);
    if (eventDate < new Date()) {
      throw new AppError("Cannot book tickets for past events", 400);
    }

    const unitPrice = event.ticketPrice;
    const totalAmount = unitPrice * quantity;
    const amountPaise = Math.round(totalAmount * 100);

    if (amountPaise < 100) {
      throw new AppError("Minimum booking amount is ₹1", 400);
    }

    // Create Razorpay order
    const razorpay = getRazorpayInstance();
    let razorpayOrder: { id: string };
    try {
      razorpayOrder = (await razorpay.orders.create({
        amount: amountPaise,
        currency: "INR",
        notes: {
          userId: req.user.userId,
          eventId: eventId,
          type: "ticket_booking",
        },
      })) as { id: string };
    } catch (err) {
      throw toPaymentProviderError(err, "Unable to create payment order. Please try again.");
    }

    // Create booking record
    const booking = await TicketBooking.create({
      userId: new mongoose.Types.ObjectId(req.user.userId),
      eventId: new mongoose.Types.ObjectId(eventId),
      quantity,
      unitPrice,
      totalAmount,
      bookingStatus: "created",
      razorpayOrderId: razorpayOrder.id,
      phone,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min expiry
    });

    return res.status(201).json({
      success: true,
      bookingId: booking._id,
      orderId: razorpayOrder.id,
      amount: totalAmount,
      amountInPaise: amountPaise,
      currency: "INR",
      keyId: getRazorpayKeyId(),
      event: {
        title: event.title,
        date: event.date,
        venue: event.venue,
        coverImage: event.coverImage,
      },
      message: "Booking created successfully",
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// USER: Verify ticket booking payment
// ─────────────────────────────────────────────────────────────

export const verifyTicketBooking: RequestHandler = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    if (!req.user) throw new AppError("Unauthorized", 401);

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = verifySchema.parse(req.body);

    const booking = await TicketBooking.findOne({ razorpayOrderId: razorpay_order_id });
    if (!booking) throw new AppError("Booking not found", 404);

    if (booking.userId.toString() !== req.user.userId) {
      throw new AppError("Forbidden", 403);
    }

    if (booking.bookingStatus === "paid") {
      const ticket = await Ticket.findOne({ orderId: booking._id }).lean();
      const event = await Event.findById(booking.eventId).select("title date venue coverImage").lean();
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        booking: {
          _id: booking._id,
          bookingNumber: booking.bookingNumber,
          totalAmount: booking.totalAmount,
          bookingStatus: booking.bookingStatus,
        },
        ticket,
        event,
      });
    }

    if (booking.bookingStatus === "failed") {
      throw new AppError("This booking has already failed", 400);
    }

    // Verify signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) throw new AppError("Payment configuration error", 500);

    const digest = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (!safeSignatureCompare(digest, razorpay_signature)) {
      booking.bookingStatus = "failed";
      booking.razorpayPaymentId = razorpay_payment_id;
      booking.expiresAt = undefined;
      await booking.save();
      throw new AppError("Payment verification failed. Please contact support if amount was deducted.", 400);
    }

    // Verify with Razorpay
    const razorpay = getRazorpayInstance();
    let payment: {
      id: string;
      order_id: string;
      amount: number;
      currency: string;
      status: string;
      created_at?: number;
    };
    try {
      payment = (await razorpay.payments.fetch(razorpay_payment_id)) as typeof payment;
    } catch (err) {
      throw toPaymentProviderError(err, "Unable to verify payment with provider.");
    }

    const expectedAmountPaise = Math.round(booking.totalAmount * 100);
    if (
      payment.id !== razorpay_payment_id ||
      payment.order_id !== razorpay_order_id ||
      payment.amount !== expectedAmountPaise ||
      payment.currency !== "INR" ||
      (payment.status !== "captured" && payment.status !== "authorized")
    ) {
      throw new AppError("Payment details mismatch. Verification failed.", 400);
    }

    session.startTransaction();

    const bookingInTxn = await TicketBooking.findOneAndUpdate(
      { _id: booking._id, bookingStatus: "created" },
      {
        $set: {
          bookingStatus: "paid",
          razorpayPaymentId: razorpay_payment_id,
          paymentCapturedAt: new Date((payment.created_at || Math.floor(Date.now() / 1000)) * 1000),
        },
        $unset: { expiresAt: 1 },
      },
      { session, returnDocument: "after" }
    );

    if (!bookingInTxn) {
      await session.abortTransaction();
      const currentBooking = await TicketBooking.findById(booking._id);
      if (currentBooking && currentBooking.bookingStatus === "paid") {
        const ticket = await Ticket.findOne({ orderId: booking._id }).lean();
        const event = await Event.findById(booking.eventId).select("title date venue coverImage").lean();
        return res.status(200).json({
          success: true,
          message: "Payment already verified",
          booking: {
            _id: currentBooking._id,
            bookingNumber: currentBooking.bookingNumber,
            totalAmount: currentBooking.totalAmount,
            bookingStatus: currentBooking.bookingStatus,
          },
          ticket,
          event,
        });
      }
      throw new AppError("Failed to process booking", 400);
    }

    const { ticketId, ticket } = await fulfillTicketBooking(bookingInTxn, session);
    await session.commitTransaction();

    const event = await Event.findById(booking.eventId).select("title date venue coverImage startTime").lean();

    return res.status(200).json({
      success: true,
      message: "Payment successful! Your ticket has been booked.",
      booking: {
        _id: bookingInTxn._id,
        bookingNumber: bookingInTxn.bookingNumber,
        totalAmount: bookingInTxn.totalAmount,
        bookingStatus: bookingInTxn.bookingStatus,
        quantity: bookingInTxn.quantity,
      },
      ticket: {
        _id: ticket._id,
        ticketId,
        quantity: bookingInTxn.quantity,
      },
      event,
    });
  } catch (err) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    next(err);
  } finally {
    session.endSession();
  }
};

// ─────────────────────────────────────────────────────────────
// USER: Get my ticket bookings
// ─────────────────────────────────────────────────────────────

export const myTicketBookings: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);

    const { page, limit, status } = listQuerySchema.parse(req.query);
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { userId: req.user.userId };
    if (status) filter.bookingStatus = status;

    const [bookings, total] = await Promise.all([
      TicketBooking.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("eventId", "title date venue coverImage startTime")
        .lean(),
      TicketBooking.countDocuments(filter),
    ]);

    // Get associated tickets
    const bookingIds = bookings.map((b) => b._id);
    const tickets = await Ticket.find({ orderId: { $in: bookingIds } }).lean();
    const ticketMap = new Map(tickets.map((t) => [t.orderId.toString(), t]));

    const enhancedBookings = bookings.map((booking) => ({
      ...booking,
      ticket: ticketMap.get(booking._id.toString()) || null,
    }));

    const totalPages = Math.ceil(total / limit);

    return res.json({
      bookings: enhancedBookings,
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
// USER: Get single ticket booking details
// ─────────────────────────────────────────────────────────────

export const getTicketBookingById: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);

    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid booking ID", 400);
    }

    const booking = await TicketBooking.findOne({
      _id: id,
      userId: req.user.userId,
    })
      .populate("eventId", "title description date startTime venue coverImage galleryImages ticketPrice totalSeats seatsLeft")
      .lean();

    if (!booking) throw new AppError("Booking not found", 404);

    const ticket = await Ticket.findOne({ orderId: id }).lean();

    return res.json({ booking, ticket });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN: List all ticket bookings
// ─────────────────────────────────────────────────────────────

const adminListSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  status: z.enum(["created", "paid", "failed", "cancelled", "refunded"]).optional(),
  eventId: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(["createdAt", "totalAmount"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const adminListTicketBookings: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      throw new AppError("Forbidden: Admin access required", 403);
    }

    const { page, limit, status, eventId, search, sortBy, sortOrder } = adminListSchema.parse(req.query);
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (status) filter.bookingStatus = status;
    if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
      filter.eventId = new mongoose.Types.ObjectId(eventId);
    }
    if (search) {
      filter.$or = [
        { phone: { $regex: search, $options: "i" } },
        { bookingNumber: { $regex: search, $options: "i" } },
        { razorpayOrderId: { $regex: search, $options: "i" } },
      ];
    }

    const sortDirection = sortOrder === "asc" ? 1 : -1;

    const [bookings, total] = await Promise.all([
      TicketBooking.find(filter)
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(limit)
        .populate("userId", "email name")
        .populate("eventId", "title date venue")
        .lean(),
      TicketBooking.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.json({
      bookings,
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
// ADMIN: Get ticket booking statistics
// ─────────────────────────────────────────────────────────────

export const getTicketBookingStats: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      throw new AppError("Forbidden: Admin access required", 403);
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNinetyDays = new Date(now);
    startOfNinetyDays.setDate(startOfNinetyDays.getDate() - 89);

    const [
      totalBookings,
      paidBookings,
      failedBookings,
      totalRevenue,
      todayBookings,
      todayRevenue,
      monthlyRevenue,
      revenueByDay,
      bookingsByEvent,
    ] = await Promise.all([
      TicketBooking.countDocuments(),
      TicketBooking.countDocuments({ bookingStatus: "paid" }),
      TicketBooking.countDocuments({ bookingStatus: "failed" }),
      TicketBooking.aggregate([
        { $match: { bookingStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      TicketBooking.countDocuments({ bookingStatus: "paid", createdAt: { $gte: startOfToday } }),
      TicketBooking.aggregate([
        { $match: { bookingStatus: "paid", createdAt: { $gte: startOfToday } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      TicketBooking.aggregate([
        { $match: { bookingStatus: "paid", createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      TicketBooking.aggregate([
        {
          $match: {
            bookingStatus: "paid",
            createdAt: { $gte: startOfNinetyDays },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: "Asia/Kolkata",
              },
            },
            total: { $sum: "$totalAmount" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      TicketBooking.aggregate([
        { $match: { bookingStatus: "paid" } },
        {
          $lookup: {
            from: "events",
            localField: "eventId",
            foreignField: "_id",
            as: "event",
          },
        },
        { $unwind: "$event" },
        {
          $group: {
            _id: "$eventId",
            eventTitle: { $first: "$event.title" },
            eventDate: { $first: "$event.date" },
            totalBookings: { $sum: 1 },
            totalTickets: { $sum: "$quantity" },
            totalRevenue: { $sum: "$totalAmount" },
          },
        },
        { $sort: { eventDate: -1 } },
        { $limit: 10 },
      ]),
    ]);

    return res.json({
      stats: {
        totalBookings,
        paidBookings,
        failedBookings,
        pendingBookings: totalBookings - paidBookings - failedBookings,
        totalRevenue: totalRevenue[0]?.total || 0,
        todayBookings,
        todayRevenue: todayRevenue[0]?.total || 0,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
        revenueByDay: revenueByDay.map((entry) => ({
          date: entry._id,
          total: entry.total,
        })),
      },
      bookingsByEvent,
    });
  } catch (err) {
    next(err);
  }
};
