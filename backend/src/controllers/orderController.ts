import type { RequestHandler } from "express";
import { z } from "zod";
import { AppError } from "../middleware/errorHandler";
import { getRazorpayInstance, getRazorpayKeyId } from "../utils/razorpay";
import crypto from "node:crypto";
import { Order, type OrderDocument } from "../models/Order";
import { Ticket } from "../models/Ticket";
import { Event } from "../models/Event";
import { Art } from "../models/Art";
import mongoose from "mongoose";
import { nanoid } from "nanoid";
import { jsonToCSV, flattenObject } from "../utils/csvExport";

// ─────────────────────────────────────────────────────────────
// Validation Schemas
// ─────────────────────────────────────────────────────────────

const orderItemSchema = z.object({
  itemType: z.enum(["art", "event"]),
  itemId: z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), {
    message: "Invalid item ID",
  }),
  quantity: z.number().int().min(1),
  frameSize: z.string().optional(), // For art items
  // Kept optional for backward compatibility from older frontend payloads.
  title: z.string().optional(),
  price: z.number().optional(),
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
// Helpers
// ─────────────────────────────────────────────────────────────

async function buildAuthoritativeOrderItems(items: z.infer<typeof orderItemSchema>[]) {
  const normalizedItems: Array<{
    itemType: "art" | "event";
    itemId: string;
    title: string;
    quantity: number;
    price: number;
    frameSize?: string;
  }> = [];

  const errors: string[] = [];

  for (const item of items) {
    if (item.itemType === "event") {
      const event = await Event.findById(item.itemId);
      if (!event) {
        errors.push("Selected event not found");
      } else if (event.seatsLeft < item.quantity) {
        errors.push(`Only ${event.seatsLeft} seats left for "${event.title}"`);
      } else {
        normalizedItems.push({
          itemType: "event",
          itemId: item.itemId,
          title: event.title,
          quantity: item.quantity,
          price: event.ticketPrice,
        });
      }
    } else if (item.itemType === "art") {
      const art = await Art.findById(item.itemId);
      if (!art) {
        errors.push("Selected artwork not found");
      } else if (!art.isAvailable) {
        errors.push(`Art "${art.title}" is currently unavailable`);
      } else if (art.quantity < item.quantity) {
        errors.push(`Only ${art.quantity} quantity left for "${art.title}"`);
      } else {
        normalizedItems.push({
          itemType: "art",
          itemId: item.itemId,
          title: art.title,
          quantity: item.quantity,
          price: art.price,
          frameSize: item.frameSize,
        });
      }
    }
  }

  return { errors, normalizedItems };
}

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

async function fulfillPaidOrder(order: OrderDocument, session: mongoose.ClientSession) {
  const tickets: Array<{ ticketId: string; eventTitle: string; quantity: number }> = [];

  for (const item of order.items) {
    if (item.itemType === "event") {
      const eventId = new mongoose.Types.ObjectId(item.itemId);

      const updateResult = await Event.findOneAndUpdate(
        {
          _id: eventId,
          seatsLeft: { $gte: item.quantity },
        },
        { $inc: { seatsLeft: -item.quantity } },
        {
          session,
          returnDocument: "after",
        }
      );

      if (!updateResult) {
        throw new AppError(`Not enough seats left for "${item.title}".`, 400);
      }

      const ticketId = `TKT-${Date.now().toString(36).toUpperCase()}-${nanoid(6).toUpperCase()}`;
      await Ticket.create(
        [
          {
            userId: order.userId,
            eventId,
            orderId: order._id,
            ticketId,
            quantity: item.quantity,
            status: "active",
          },
        ],
        { session }
      );

      tickets.push({ ticketId, eventTitle: item.title, quantity: item.quantity });
      continue;
    }

    const artId = new mongoose.Types.ObjectId(item.itemId);
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

  return tickets;
}

// ─────────────────────────────────────────────────────────────
// USER: Create Razorpay order
// ─────────────────────────────────────────────────────────────

export const createOrder: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);

    const { items, address, phone } = createOrderSchema.parse(req.body);

    const { errors, normalizedItems } = await buildAuthoritativeOrderItems(items);
    if (errors.length > 0) {
      throw new AppError(errors.join("; "), 400);
    }

    const hasArtItems = normalizedItems.some((item) => item.itemType === "art");
    if (hasArtItems && !address?.trim()) {
      throw new AppError("Delivery address is required for art orders", 400);
    }

    const finalAddress = address?.trim() || "Digital Ticket - No shipping required";

    const amount = normalizedItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
    const amountPaise = Math.round(amount * 100);

    if (amountPaise < 100) {
      throw new AppError("Minimum order amount is ₹1", 400);
    }

    const razorpay = getRazorpayInstance();
    let order: { id: string };
    try {
      order = (await razorpay.orders.create({
        amount: amountPaise,
        currency: "INR",
        notes: {
          userId: req.user.userId,
          itemCount: normalizedItems.length.toString(),
        },
      })) as { id: string };
    } catch (err) {
      throw toPaymentProviderError(err, "Unable to create payment order. Please try again.");
    }

    await Order.create({
      userId: new mongoose.Types.ObjectId(req.user.userId),
      items: normalizedItems,
      totalAmount: amount,
      paymentStatus: "created",
      razorpayOrderId: order.id,
      address: finalAddress,
      phone,
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
  address: z.string().min(10).optional(),
  phone: z.string().regex(/^\d{10}$/).optional(),
});

const reconcileSchema = z.object({
  razorpay_order_id: z.string().min(1),
  address: z.string().min(10).optional(),
  phone: z.string().regex(/^\d{10}$/).optional(),
});

async function buildOrderSuccessPayload(order: OrderDocument) {
  const tickets = await Ticket.find({ orderId: order._id }).select("ticketId quantity").lean();

  return {
    success: true,
    order: {
      _id: order._id,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      paymentStatus: order.paymentStatus,
      items: order.items,
    },
    tickets,
  };
}

function assertOrderOwnership(order: OrderDocument, requesterUserId: string, requesterRole: string) {
  const isAdmin = requesterRole === "admin";
  if (!isAdmin && order.userId.toString() !== requesterUserId) {
    throw new AppError("Forbidden", 403);
  }
}

export const verifyOrder: RequestHandler = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    if (!req.user) throw new AppError("Unauthorized", 401);

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, address, phone } = verifySchema.parse(req.body);

    const existingOrder = await Order.findOne({ razorpayOrderId: razorpay_order_id });

    if (!existingOrder) {
      throw new AppError("Order not found for verification", 404);
    }

    assertOrderOwnership(existingOrder, req.user.userId, req.user.role);

    if (existingOrder.paymentStatus === "paid") {
      return res.status(200).json({
        ...(await buildOrderSuccessPayload(existingOrder)),
        message: "Payment already verified",
      });
    }

    if (existingOrder.paymentStatus === "failed") {
      throw new AppError("This payment attempt is already marked failed", 400);
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) throw new AppError("Payment configuration error", 500);

    const digest = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (!safeSignatureCompare(digest, razorpay_signature)) {
      existingOrder.paymentStatus = "failed";
      existingOrder.razorpayPaymentId = razorpay_payment_id;
      await existingOrder.save();
      throw new AppError("Payment verification failed. Please contact support if amount was deducted.", 400);
    }

    const duplicatePaidOrder = await Order.findOne({
      razorpayPaymentId: razorpay_payment_id,
      _id: { $ne: existingOrder._id },
      paymentStatus: "paid",
    }).lean();

    if (duplicatePaidOrder) {
      throw new AppError("Payment already linked with another order", 409);
    }

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
      payment = (await razorpay.payments.fetch(razorpay_payment_id)) as {
        id: string;
        order_id: string;
        amount: number;
        currency: string;
        status: string;
        created_at?: number;
      };
    } catch (err) {
      throw toPaymentProviderError(err, "Unable to verify payment with provider.");
    }

    const expectedAmountPaise = Math.round(existingOrder.totalAmount * 100);
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

    const orderInTxn = await Order.findOne({ _id: existingOrder._id }).session(session);
    if (!orderInTxn) {
      throw new AppError("Order not found", 404);
    }

    if (orderInTxn.paymentStatus === "paid") {
      await session.commitTransaction();
      return res.status(200).json({
        ...(await buildOrderSuccessPayload(orderInTxn)),
        message: "Payment already verified",
      });
    }

    if (orderInTxn.paymentStatus === "failed") {
      throw new AppError("This payment attempt is already marked failed", 400);
    }

    orderInTxn.paymentStatus = "paid";
    orderInTxn.razorpayPaymentId = razorpay_payment_id;
    orderInTxn.paymentCapturedAt = new Date((payment.created_at || Math.floor(Date.now() / 1000)) * 1000);
    if (address?.trim()) orderInTxn.address = address.trim();
    if (phone?.trim()) orderInTxn.phone = phone.trim();
    await orderInTxn.save({ session });

    const tickets = await fulfillPaidOrder(orderInTxn, session);

    await session.commitTransaction();

    return res.status(200).json({ 
      success: true, 
      message: "Payment successful! Your order has been placed.",
      order: {
        _id: orderInTxn._id,
        orderNumber: orderInTxn.orderNumber,
        totalAmount: orderInTxn.totalAmount,
        paymentStatus: orderInTxn.paymentStatus,
        items: orderInTxn.items,
      },
      tickets: tickets.length > 0 ? tickets : undefined,
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

export const reconcileOrder: RequestHandler = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    if (!req.user) throw new AppError("Unauthorized", 401);

    const { razorpay_order_id, address, phone } = reconcileSchema.parse(req.body);

    const existingOrder = await Order.findOne({ razorpayOrderId: razorpay_order_id });

    if (!existingOrder) {
      throw new AppError("Order not found", 404);
    }

    assertOrderOwnership(existingOrder, req.user.userId, req.user.role);

    if (existingOrder.paymentStatus === "paid") {
      return res.status(200).json({
        ...(await buildOrderSuccessPayload(existingOrder)),
        message: "Order already paid",
      });
    }

    if (existingOrder.paymentStatus === "failed") {
      return res.status(200).json({ success: false, paymentStatus: "failed", message: "Payment marked as failed" });
    }

    const razorpay = getRazorpayInstance();
    let paymentsResult: {
      items?: Array<{
        id: string;
        order_id: string;
        amount: number;
        currency: string;
        status: string;
        created_at?: number;
      }>;
    };
    try {
      paymentsResult = (await razorpay.orders.fetchPayments(razorpay_order_id)) as {
        items?: Array<{
          id: string;
          order_id: string;
          amount: number;
          currency: string;
          status: string;
          created_at?: number;
        }>;
      };
    } catch (err) {
      throw toPaymentProviderError(err, "Unable to reconcile payment with provider.");
    }

    const matchedPayment = paymentsResult.items?.find((payment) => payment.status === "captured");

    if (!matchedPayment) {
      return res.status(200).json({ success: false, paymentStatus: "created", message: "Payment still pending" });
    }

    if (
      matchedPayment.order_id !== razorpay_order_id ||
      matchedPayment.amount !== Math.round(existingOrder.totalAmount * 100) ||
      matchedPayment.currency !== "INR"
    ) {
      throw new AppError("Payment details mismatch during reconciliation", 400);
    }

    const duplicatePaidOrder = await Order.findOne({
      razorpayPaymentId: matchedPayment.id,
      _id: { $ne: existingOrder._id },
      paymentStatus: "paid",
    }).lean();

    if (duplicatePaidOrder) {
      throw new AppError("Payment already linked with another order", 409);
    }

    session.startTransaction();

    const orderInTxn = await Order.findOne({ _id: existingOrder._id }).session(session);
    if (!orderInTxn) throw new AppError("Order not found", 404);

    if (orderInTxn.paymentStatus === "paid") {
      await session.commitTransaction();
      return res.status(200).json({
        ...(await buildOrderSuccessPayload(orderInTxn)),
        message: "Order already paid",
      });
    }

    if (orderInTxn.paymentStatus === "failed") {
      await session.commitTransaction();
      return res.status(200).json({ success: false, paymentStatus: "failed", message: "Payment marked as failed" });
    }

    orderInTxn.paymentStatus = "paid";
    orderInTxn.razorpayPaymentId = matchedPayment.id;
    orderInTxn.paymentCapturedAt = new Date((matchedPayment.created_at || Math.floor(Date.now() / 1000)) * 1000);
    if (address?.trim()) orderInTxn.address = address.trim();
    if (phone?.trim()) orderInTxn.phone = phone.trim();
    await orderInTxn.save({ session });

    await fulfillPaidOrder(orderInTxn, session);
    await session.commitTransaction();

    return res.status(200).json({
      ...(await buildOrderSuccessPayload(orderInTxn)),
      message: "Payment reconciled successfully",
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

export const razorpayWebhook: RequestHandler = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) throw new AppError("Webhook secret is not configured", 500);

    if (!Buffer.isBuffer(req.body)) {
      throw new AppError("Invalid webhook payload", 400);
    }

    const signature = req.header("x-razorpay-signature");
    if (!signature) throw new AppError("Missing webhook signature", 400);

    const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(req.body).digest("hex");
    if (!safeSignatureCompare(expectedSignature, signature)) {
      throw new AppError("Invalid webhook signature", 401);
    }

    const payload = JSON.parse(req.body.toString("utf8")) as {
      event?: string;
      created_at?: number;
      payload?: {
        payment?: { entity?: { id?: string; order_id?: string; amount?: number; currency?: string; created_at?: number } };
        order?: { entity?: { id?: string } };
      };
    };

    const eventType = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;
    const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
    const razorpayPaymentId = paymentEntity?.id;
    const eventKey = `${eventType || "unknown"}:${razorpayPaymentId || razorpayOrderId || "na"}:${payload.created_at || 0}`;

    if (!razorpayOrderId || !eventType) {
      return res.status(200).json({ received: true, ignored: true });
    }

    if (eventType === "payment.failed") {
      await Order.updateOne(
        {
          razorpayOrderId,
          paymentStatus: "created",
        },
        {
          $set: {
            paymentStatus: "failed",
            razorpayPaymentId: razorpayPaymentId,
            lastWebhookEventKey: eventKey,
          },
        }
      );

      return res.status(200).json({ received: true });
    }

    if (eventType !== "payment.captured" && eventType !== "order.paid") {
      return res.status(200).json({ received: true, ignored: true });
    }

    session.startTransaction();

    const orderInTxn = await Order.findOne({ razorpayOrderId }).session(session);
    if (!orderInTxn) {
      await session.commitTransaction();
      return res.status(200).json({ received: true, ignored: true });
    }

    if (orderInTxn.lastWebhookEventKey === eventKey) {
      await session.commitTransaction();
      return res.status(200).json({ received: true, duplicate: true });
    }

    if (orderInTxn.paymentStatus === "paid") {
      orderInTxn.lastWebhookEventKey = eventKey;
      if (razorpayPaymentId && !orderInTxn.razorpayPaymentId) {
        orderInTxn.razorpayPaymentId = razorpayPaymentId;
      }
      await orderInTxn.save({ session });
      await session.commitTransaction();
      return res.status(200).json({ received: true });
    }

    if (paymentEntity?.amount && paymentEntity.amount !== Math.round(orderInTxn.totalAmount * 100)) {
      throw new AppError("Webhook payment amount mismatch", 400);
    }

    if (paymentEntity?.currency && paymentEntity.currency !== "INR") {
      throw new AppError("Webhook currency mismatch", 400);
    }

    orderInTxn.paymentStatus = "paid";
    if (razorpayPaymentId) orderInTxn.razorpayPaymentId = razorpayPaymentId;
    orderInTxn.lastWebhookEventKey = eventKey;
    orderInTxn.paymentCapturedAt = new Date(
      ((paymentEntity?.created_at || payload.created_at || Math.floor(Date.now() / 1000)) as number) * 1000
    );
    await orderInTxn.save({ session });

    await fulfillPaidOrder(orderInTxn, session);
    await session.commitTransaction();

    return res.status(200).json({ received: true });
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

// ─────────────────────────────────────────────────────────────
// ADMIN: Export orders to CSV
// ─────────────────────────────────────────────────────────────

const exportSchema = z.object({
  status: z.enum(["created", "paid", "failed"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const exportOrdersCSV: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      throw new AppError("Forbidden: Admin access required", 403);
    }
    
    const { status, startDate, endDate } = exportSchema.parse(req.query);
    
    const filter: Record<string, unknown> = {};
    if (status) filter.paymentStatus = status;
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) (filter.createdAt as Record<string, unknown>).$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        (filter.createdAt as Record<string, unknown>).$lte = end;
      }
    }
    
    const orders = await Order.find(filter)
      .populate("userId", "email name phone")
      .sort({ createdAt: -1 })
      .limit(10000) // Limit to prevent memory issues
      .lean();
    
    if (orders.length === 0) {
      throw new AppError("No orders found for export", 404);
    }
    
    // Flatten orders for CSV
    const flattenedOrders = orders.map(order => {
      const flat = flattenObject(order as unknown as Record<string, unknown>);
      return {
        OrderNumber: flat.orderNumber,
        OrderID: flat._id,
        UserEmail: flat['userId.email'] || '',
        UserName: flat['userId.name'] || '',
        TotalAmount: flat.totalAmount,
        PaymentStatus: flat.paymentStatus,
        RazorpayOrderID: flat.razorpayOrderId || '',
        RazorpayPaymentID: flat.razorpayPaymentId || '',
        Phone: flat.phone,
        Address: flat.address,
        ItemCount: Array.isArray(order.items) ? order.items.length : 0,
        CreatedAt: flat.createdAt,
        UpdatedAt: flat.updatedAt,
      };
    });
    
    const csv = jsonToCSV(flattenedOrders);
    
    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=orders-${Date.now()}.csv`);
    
    return res.send(csv);
  } catch (err) {
    next(err);
  }
};
