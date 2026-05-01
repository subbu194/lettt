import type { RequestHandler } from "express";
import { z } from "zod";
import crypto from "node:crypto";
import mongoose from "mongoose";
import { AppError } from "../middleware/errorHandler";
import { getRazorpayInstance, getRazorpayKeyId } from "../utils/razorpay";
import { ArtOrder, type ArtOrderDocument } from "../models/ArtOrder";
import { Art } from "../models/Art";

// ─────────────────────────────────────────────────────────────
// Validation Schemas
// ─────────────────────────────────────────────────────────────

const artItemSchema = z.object({
  artId: z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), {
    message: "Invalid art ID",
  }),
  quantity: z.number().int().min(1).max(10),
  frameSize: z.string().optional(),
});

const createOrderSchema = z.object({
  items: z.array(artItemSchema).min(1, "Cart cannot be empty").max(20),
  shippingAddress: z.string().min(10, "Address must be at least 10 characters"),
  phone: z.string().regex(/^\d{10}$/, "Please enter a valid 10-digit phone number"),
});

const listQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(50).optional().default(10),
  status: z.enum(["created", "paid", "failed", "processing", "shipped", "delivered", "cancelled", "refunded"]).optional(),
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

async function fulfillArtOrder(order: ArtOrderDocument, session: mongoose.ClientSession) {
  for (const item of order.items) {
    const artId = item.artId;
    const updateResult = await Art.findOneAndUpdate(
      {
        _id: artId,
        isAvailable: true,
        quantity: { $gte: item.quantity },
      },
      { $inc: { quantity: -item.quantity } },
      {
        session,
        returnDocument: "after",
      }
    );

    if (!updateResult) {
      throw new AppError(`"${item.title}" is no longer available in requested quantity.`, 400);
    }

    if (updateResult.quantity === 0) {
      await Art.updateOne({ _id: artId }, { isAvailable: false }, { session });
    }
  }
}

// ─────────────────────────────────────────────────────────────
// USER: Create art order
// ─────────────────────────────────────────────────────────────

export const createArtOrder: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);

    const { items, shippingAddress, phone } = createOrderSchema.parse(req.body);

    // Build order items with validation
    const orderItems: Array<{
      artId: mongoose.Types.ObjectId;
      title: string;
      artist: string;
      image: string;
      quantity: number;
      unitPrice: number;
      frameSize?: string;
    }> = [];
    const errors: string[] = [];

    for (const item of items) {
      const art = await Art.findById(item.artId);
      if (!art) {
        errors.push("Selected artwork not found");
      } else if (!art.isAvailable) {
        errors.push(`Art "${art.title}" is currently unavailable`);
      } else if (art.quantity < item.quantity) {
        errors.push(`Only ${art.quantity} quantity left for "${art.title}"`);
      } else {
        orderItems.push({
          artId: new mongoose.Types.ObjectId(item.artId),
          title: art.title,
          artist: art.artist,
          image: art.images[0] || "",
          quantity: item.quantity,
          unitPrice: art.price,
          frameSize: item.frameSize,
        });
      }
    }

    if (errors.length > 0) {
      throw new AppError(errors.join("; "), 400);
    }

    const subtotal = orderItems.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
    const shippingFee = subtotal >= 5000 ? 0 : 99; // Free shipping over ₹5000
    const totalAmount = subtotal + shippingFee;
    const amountPaise = Math.round(totalAmount * 100);

    if (amountPaise < 100) {
      throw new AppError("Minimum order amount is ₹1", 400);
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
          itemCount: orderItems.length.toString(),
          type: "art_order",
        },
      })) as { id: string };
    } catch (err) {
      throw toPaymentProviderError(err, "Unable to create payment order. Please try again.");
    }

    // Create order record
    const order = await ArtOrder.create({
      userId: new mongoose.Types.ObjectId(req.user.userId),
      items: orderItems,
      subtotal,
      shippingFee,
      totalAmount,
      orderStatus: "created",
      razorpayOrderId: razorpayOrder.id,
      shippingAddress,
      phone,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min expiry
    });

    return res.status(201).json({
      success: true,
      orderId: razorpayOrder.id,
      artOrderId: order._id,
      amount: totalAmount,
      subtotal,
      shippingFee,
      amountInPaise: amountPaise,
      currency: "INR",
      keyId: getRazorpayKeyId(),
      items: orderItems.map((item) => ({
        title: item.title,
        artist: item.artist,
        image: item.image,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      message: "Order created successfully",
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// USER: Verify art order payment
// ─────────────────────────────────────────────────────────────

export const verifyArtOrder: RequestHandler = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    if (!req.user) throw new AppError("Unauthorized", 401);

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = verifySchema.parse(req.body);

    const order = await ArtOrder.findOne({ razorpayOrderId: razorpay_order_id });
    if (!order) throw new AppError("Order not found", 404);

    if (order.userId.toString() !== req.user.userId) {
      throw new AppError("Forbidden", 403);
    }

    if (order.orderStatus === "paid" || order.orderStatus === "processing" || order.orderStatus === "shipped" || order.orderStatus === "delivered") {
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          orderStatus: order.orderStatus,
          items: order.items,
        },
      });
    }

    if (order.orderStatus === "failed") {
      throw new AppError("This order has already failed", 400);
    }

    // Verify signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) throw new AppError("Payment configuration error", 500);

    const digest = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (!safeSignatureCompare(digest, razorpay_signature)) {
      order.orderStatus = "failed";
      order.razorpayPaymentId = razorpay_payment_id;
      order.expiresAt = undefined;
      await order.save();
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

    const expectedAmountPaise = Math.round(order.totalAmount * 100);
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

    const orderInTxn = await ArtOrder.findOneAndUpdate(
      { _id: order._id, orderStatus: "created" },
      {
        $set: {
          orderStatus: "paid",
          razorpayPaymentId: razorpay_payment_id,
          paymentCapturedAt: new Date((payment.created_at || Math.floor(Date.now() / 1000)) * 1000),
        },
        $unset: { expiresAt: 1 },
      },
      { session, returnDocument: "after" }
    );

    if (!orderInTxn) {
      await session.abortTransaction();
      const currentOrder = await ArtOrder.findById(order._id);
      if (currentOrder && (currentOrder.orderStatus === "paid" || currentOrder.orderStatus === "processing")) {
        return res.status(200).json({
          success: true,
          message: "Payment already verified",
          order: {
            _id: currentOrder._id,
            orderNumber: currentOrder.orderNumber,
            totalAmount: currentOrder.totalAmount,
            orderStatus: currentOrder.orderStatus,
            items: currentOrder.items,
          },
        });
      }
      throw new AppError("Failed to process order", 400);
    }

    await fulfillArtOrder(orderInTxn, session);
    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "Payment successful! Your order has been placed.",
      order: {
        _id: orderInTxn._id,
        orderNumber: orderInTxn.orderNumber,
        totalAmount: orderInTxn.totalAmount,
        subtotal: orderInTxn.subtotal,
        shippingFee: orderInTxn.shippingFee,
        orderStatus: orderInTxn.orderStatus,
        items: orderInTxn.items,
        shippingAddress: orderInTxn.shippingAddress,
      },
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
// USER: Get my art orders
// ─────────────────────────────────────────────────────────────

export const myArtOrders: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);

    const { page, limit, status } = listQuerySchema.parse(req.query);
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { userId: req.user.userId };
    if (status) filter.orderStatus = status;

    const [orders, total] = await Promise.all([
      ArtOrder.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ArtOrder.countDocuments(filter),
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
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// USER: Get single art order details
// ─────────────────────────────────────────────────────────────

export const getArtOrderById: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);

    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid order ID", 400);
    }

    const order = await ArtOrder.findOne({
      _id: id,
      userId: req.user.userId,
    }).lean();

    if (!order) throw new AppError("Order not found", 404);

    return res.json({ order });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN: List all art orders
// ─────────────────────────────────────────────────────────────

const adminListSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  status: z.enum(["created", "paid", "failed", "processing", "shipped", "delivered", "cancelled", "refunded"]).optional(),
  search: z.string().optional(),
  sortBy: z.enum(["createdAt", "totalAmount"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const adminListArtOrders: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      throw new AppError("Forbidden: Admin access required", 403);
    }

    const { page, limit, status, search, sortBy, sortOrder } = adminListSchema.parse(req.query);
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (status) filter.orderStatus = status;
    if (search) {
      filter.$or = [
        { phone: { $regex: search, $options: "i" } },
        { orderNumber: { $regex: search, $options: "i" } },
        { razorpayOrderId: { $regex: search, $options: "i" } },
        { trackingNumber: { $regex: search, $options: "i" } },
      ];
    }

    const sortDirection = sortOrder === "asc" ? 1 : -1;

    const [orders, total] = await Promise.all([
      ArtOrder.find(filter)
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(limit)
        .populate("userId", "email name")
        .lean(),
      ArtOrder.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Map userId to user for frontend compatibility
    const mappedOrders = orders.map((order: any) => ({
      ...order,
      user: order.userId,
      userId: undefined,
    }));

    return res.json({
      orders: mappedOrders,
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
// ADMIN: Update order status (for shipping/delivery)
// ─────────────────────────────────────────────────────────────

const updateStatusSchema = z.object({
  status: z.enum(["processing", "shipped", "delivered", "cancelled"]),
  trackingNumber: z.string().optional(),
});

export const updateArtOrderStatus: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      throw new AppError("Forbidden: Admin access required", 403);
    }

    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid order ID", 400);
    }

    const { status, trackingNumber } = updateStatusSchema.parse(req.body);

    const order = await ArtOrder.findById(id);
    if (!order) throw new AppError("Order not found", 404);

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      paid: ["processing", "cancelled"],
      processing: ["shipped", "cancelled"],
      shipped: ["delivered"],
      delivered: [],
      cancelled: [],
      failed: [],
      created: ["cancelled"],
      refunded: [],
    };

    if (!validTransitions[order.orderStatus]?.includes(status)) {
      throw new AppError(`Cannot transition from ${order.orderStatus} to ${status}`, 400);
    }

    const updateData: Record<string, unknown> = { orderStatus: status };
    
    if (status === "shipped") {
      updateData.shippedAt = new Date();
      if (trackingNumber) updateData.trackingNumber = trackingNumber;
    } else if (status === "delivered") {
      updateData.deliveredAt = new Date();
    }

    const updatedOrder = await ArtOrder.findByIdAndUpdate(id, updateData, { new: true });

    return res.json({
      success: true,
      message: `Order status updated to ${status}`,
      order: updatedOrder,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN: Get art order statistics
// ─────────────────────────────────────────────────────────────

export const getArtOrderStats: RequestHandler = async (req, res, next) => {
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
      totalOrders,
      paidOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      failedOrders,
      totalRevenue,
      todayOrders,
      todayRevenue,
      monthlyRevenue,
      revenueByDay,
      topSellingArt,
    ] = await Promise.all([
      ArtOrder.countDocuments(),
      ArtOrder.countDocuments({ orderStatus: "paid" }),
      ArtOrder.countDocuments({ orderStatus: "processing" }),
      ArtOrder.countDocuments({ orderStatus: "shipped" }),
      ArtOrder.countDocuments({ orderStatus: "delivered" }),
      ArtOrder.countDocuments({ orderStatus: "failed" }),
      ArtOrder.aggregate([
        { $match: { orderStatus: { $in: ["paid", "processing", "shipped", "delivered"] } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      ArtOrder.countDocuments({ 
        orderStatus: { $in: ["paid", "processing", "shipped", "delivered"] }, 
        createdAt: { $gte: startOfToday } 
      }),
      ArtOrder.aggregate([
        { $match: { orderStatus: { $in: ["paid", "processing", "shipped", "delivered"] }, createdAt: { $gte: startOfToday } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      ArtOrder.aggregate([
        { $match: { orderStatus: { $in: ["paid", "processing", "shipped", "delivered"] }, createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      ArtOrder.aggregate([
        {
          $match: {
            orderStatus: { $in: ["paid", "processing", "shipped", "delivered"] },
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
      ArtOrder.aggregate([
        { $match: { orderStatus: { $in: ["paid", "processing", "shipped", "delivered"] } } },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.artId",
            title: { $first: "$items.title" },
            artist: { $first: "$items.artist" },
            image: { $first: "$items.image" },
            totalSold: { $sum: "$items.quantity" },
            totalRevenue: { $sum: { $multiply: ["$items.unitPrice", "$items.quantity"] } },
          },
        },
        { $sort: { totalSold: -1 } },
        { $limit: 10 },
      ]),
    ]);

    return res.json({
      stats: {
        totalOrders,
        paidOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        failedOrders,
        pendingOrders: totalOrders - paidOrders - processingOrders - shippedOrders - deliveredOrders - failedOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        todayOrders,
        todayRevenue: todayRevenue[0]?.total || 0,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
        revenueByDay: revenueByDay.map((entry) => ({
          date: entry._id,
          total: entry.total,
        })),
      },
      topSellingArt,
    });
  } catch (err) {
    next(err);
  }
};
