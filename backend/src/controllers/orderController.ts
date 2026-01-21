import type { RequestHandler } from "express";
import { z } from "zod";
import { AppError } from "../middleware/errorHandler";
import { getRazorpayInstance, getRazorpayKeyId } from "../utils/razorpay";
import crypto from "node:crypto";
import { Order } from "../models/Order";
import { Ticket } from "../models/Ticket";
import { Event } from "../models/Event";
import { Art } from "../models/Art";
import mongoose from "mongoose";
import { nanoid } from "nanoid";

// ─────────────────────────────────────────────────────────────
// Validation Schemas
// ─────────────────────────────────────────────────────────────

const orderItemSchema = z.object({
  itemType: z.enum(["art", "event"]),
  itemId: z.string().min(1),
  title: z.string().min(1),
  quantity: z.number().int().min(1),
  price: z.number().min(0),
  frameSize: z.string().optional(), // For art items
});

const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, "Cart cannot be empty"),
  address: z.string().min(10, "Address must be at least 10 characters").optional(),
  phone: z.string().regex(/^\d{10}$/, "Please enter a valid 10-digit phone number"),
});

const listQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(50).optional().default(10),
  status: z.enum(["created", "paid", "failed"]).optional(),
});

// ─────────────────────────────────────────────────────────────
// Helper: Validate stock/seats availability
// ─────────────────────────────────────────────────────────────

async function validateAvailability(items: z.infer<typeof orderItemSchema>[]) {
  const errors: string[] = [];
  
  for (const item of items) {
    if (item.itemType === "event") {
      const event = await Event.findById(item.itemId);
      if (!event) {
        errors.push(`Event "${item.title}" not found`);
      } else if (event.seatsLeft < item.quantity) {
        errors.push(`Only ${event.seatsLeft} seats left for "${item.title}"`);
      }
    } else if (item.itemType === "art") {
      const art = await Art.findById(item.itemId);
      if (!art) {
        errors.push(`Art "${item.title}" not found`);
      } else if (!art.isAvailable) {
        errors.push(`Art "${item.title}" is currently unavailable`);
      }
    }
  }
  
  return errors;
}

// ─────────────────────────────────────────────────────────────
// USER: Create Razorpay order
// ─────────────────────────────────────────────────────────────

export const createOrder: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    
    const { items, address, phone } = createOrderSchema.parse(req.body);
    
    // Validate availability before creating payment
    const availabilityErrors = await validateAvailability(items);
    if (availabilityErrors.length > 0) {
      throw new AppError(availabilityErrors.join("; "), 400);
    }

    const amount = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
    const amountPaise = Math.round(amount * 100);

    if (amountPaise < 100) {
      throw new AppError("Minimum order amount is ₹1", 400);
    }

    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create({ 
      amount: amountPaise, 
      currency: "INR",
      notes: {
        userId: req.user.userId,
        itemCount: items.length.toString(),
      }
    });

    return res.status(201).json({ 
      orderId: order.id, 
      amount, 
      currency: "INR", 
      keyId: getRazorpayKeyId(),
      message: "Order created successfully"
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// USER: Verify payment and complete order
// ─────────────────────────────────────────────────────────────

const verifySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  items: z.array(orderItemSchema).min(1),
  address: z.string().min(10),
  phone: z.string().min(10),
});

export const verifyOrder: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, items, address, phone } = verifySchema.parse(req.body);

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) throw new AppError("Payment configuration error", 500);

    // Verify signature
    const hmac = crypto.createHmac("sha256", keySecret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = hmac.digest("hex");
    
    if (digest !== razorpay_signature) {
      // Log failed payment attempt
      await Order.create({
        userId: new mongoose.Types.ObjectId(req.user.userId),
        items,
        totalAmount: items.reduce((s, it) => s + it.price * it.quantity, 0),
        paymentStatus: "failed",
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        address,
        phone,
      });
      throw new AppError("Payment verification failed. Please contact support if amount was deducted.", 400);
    }

    // Re-validate availability (in case items sold out during payment)
    const availabilityErrors = await validateAvailability(items);
    if (availabilityErrors.length > 0) {
      // Refund would need to be initiated here in production
      throw new AppError(`Order cannot be completed: ${availabilityErrors.join("; ")}. A refund will be processed.`, 400);
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const totalAmount = items.reduce((s, it) => s + it.price * it.quantity, 0);
      
      // Create order
      const [savedOrder] = await Order.create([{
        userId: new mongoose.Types.ObjectId(req.user.userId),
        items,
        totalAmount,
        paymentStatus: "paid",
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        address,
        phone,
      }], { session });

      const tickets: Array<{ ticketId: string; eventTitle: string; quantity: number }> = [];

      // Process each item
      for (const item of items) {
        if (item.itemType === "event") {
          const eventId = new mongoose.Types.ObjectId(item.itemId);
          
          // Decrement seats
          await Event.updateOne(
            { _id: eventId }, 
            { $inc: { seatsLeft: -item.quantity } }, 
            { session }
          );
          
          // Create ticket
          if (!savedOrder) {
            throw new AppError("Failed to save order", 500);
          }
          const ticketId = `TKT-${Date.now().toString(36).toUpperCase()}-${nanoid(6).toUpperCase()}`;
          await Ticket.create([{
            userId: new mongoose.Types.ObjectId(req.user.userId),
            eventId,
            orderId: savedOrder._id,
            ticketId,
            quantity: item.quantity,
            status: "active",
          }], { session });
          
          tickets.push({ ticketId, eventTitle: item.title, quantity: item.quantity });
        }
      }

      await session.commitTransaction();
      session.endSession();

      if (!savedOrder) {
        throw new AppError("Failed to save order", 500);
      }

      return res.status(200).json({ 
        success: true, 
        message: "Payment successful! Your order has been placed.",
        order: {
          _id: savedOrder._id,
          totalAmount: savedOrder.totalAmount,
          paymentStatus: savedOrder.paymentStatus,
          items: savedOrder.items,
        },
        tickets: tickets.length > 0 ? tickets : undefined,
      });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// USER: Get my orders with pagination
// ─────────────────────────────────────────────────────────────

export const myOrders: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    
    const { page, limit, status } = listQuerySchema.parse(req.query);
    const skip = (page - 1) * limit;
    
    const filter: Record<string, unknown> = { userId: req.user.userId };
    if (status) filter.paymentStatus = status;
    
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);
    
    const totalPages = Math.ceil(total / limit);
    
    return res.json({ 
      orders,
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
// USER: Get single order details
// ─────────────────────────────────────────────────────────────

export const getOrderById: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid order ID", 400);
    }
    
    const order = await Order.findOne({ 
      _id: id, 
      userId: req.user.userId 
    }).lean();
    
    if (!order) throw new AppError("Order not found", 404);
    
    // Get associated tickets if any
    const tickets = await Ticket.find({ orderId: id }).lean();
    
    return res.json({ order, tickets });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN: Get all orders with filtering
// ─────────────────────────────────────────────────────────────

const adminListSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  status: z.enum(["created", "paid", "failed"]).optional(),
  search: z.string().optional(),
  sortBy: z.enum(["createdAt", "totalAmount"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const adminListOrders: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      throw new AppError("Forbidden: Admin access required", 403);
    }
    
    const { page, limit, status, search, sortBy, sortOrder } = adminListSchema.parse(req.query);
    const skip = (page - 1) * limit;
    
    const filter: Record<string, unknown> = {};
    if (status) filter.paymentStatus = status;
    if (search) {
      filter.$or = [
        { phone: { $regex: search, $options: "i" } },
        { razorpayOrderId: { $regex: search, $options: "i" } },
        { razorpayPaymentId: { $regex: search, $options: "i" } },
      ];
    }
    
    const sortDirection = sortOrder === "asc" ? 1 : -1;
    
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(limit)
        .populate("userId", "email name")
        .lean(),
      Order.countDocuments(filter),
    ]);
    
    const totalPages = Math.ceil(total / limit);
    
    return res.json({ 
      orders,
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
// ADMIN: Get order statistics
// ─────────────────────────────────────────────────────────────

export const getOrderStats: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      throw new AppError("Forbidden: Admin access required", 403);
    }
    
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const [
      totalOrders,
      paidOrders,
      failedOrders,
      totalRevenue,
      todayOrders,
      todayRevenue,
      monthlyRevenue,
      recentOrders,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ paymentStatus: "paid" }),
      Order.countDocuments({ paymentStatus: "failed" }),
      Order.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      Order.countDocuments({ paymentStatus: "paid", createdAt: { $gte: startOfToday } }),
      Order.aggregate([
        { $match: { paymentStatus: "paid", createdAt: { $gte: startOfToday } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      Order.aggregate([
        { $match: { paymentStatus: "paid", createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      Order.find({ paymentStatus: "paid" })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("userId", "email name")
        .lean(),
    ]);
    
    return res.json({
      stats: {
        totalOrders,
        paidOrders,
        failedOrders,
        pendingOrders: totalOrders - paidOrders - failedOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        todayOrders,
        todayRevenue: todayRevenue[0]?.total || 0,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
      },
      recentOrders,
    });
  } catch (err) {
    next(err);
  }
};
