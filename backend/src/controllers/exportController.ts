import type { RequestHandler } from "express";
import { AppError } from "../middleware/errorHandler";
import { Order } from "../models/Order";
import { Ticket } from "../models/Ticket";
import { Art } from "../models/Art";
import { Event } from "../models/Event";
import { User } from "../models/User";

// ─────────────────────────────────────────────────────────────
// Helper: Convert array of objects to CSV
// ─────────────────────────────────────────────────────────────

function arrayToCSV(data: any[]): string {
  if (data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const csvRows: string[] = [];

  // Add header row
  csvRows.push(headers.join(","));

  // Add data rows
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header];
      // Escape quotes and wrap in quotes if contains comma
      const escaped = String(value ?? "").replace(/"/g, '""');
      return escaped.includes(",") ? `"${escaped}"` : escaped;
    });
    csvRows.push(values.join(","));
  }

  return csvRows.join("\n");
}

// ─────────────────────────────────────────────────────────────
// ADMIN: Export orders to CSV
// ─────────────────────────────────────────────────────────────

export const exportOrders: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      throw new AppError("Forbidden: Admin access required", 403);
    }

    const orders = await Order.find()
      .populate("userId", "email name")
      .sort({ createdAt: -1 })
      .lean();

    const csvData = orders.map((order: any) => ({
      OrderNumber: order.orderNumber || "N/A",
      OrderID: order._id,
      CustomerEmail: order.userId?.email || "N/A",
      CustomerName: order.userId?.name || "N/A",
      TotalAmount: order.totalAmount,
      PaymentStatus: order.paymentStatus,
      Items: order.items.map((i: any) => `${i.title} (${i.quantity}x)`).join("; "),
      Phone: order.phone,
      Address: order.address,
      RazorpayOrderID: order.razorpayOrderId || "N/A",
      RazorpayPaymentID: order.razorpayPaymentId || "N/A",
      CreatedAt: new Date(order.createdAt).toISOString(),
    }));

    const csv = arrayToCSV(csvData);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="orders-${Date.now()}.csv"`);
    return res.send(csv);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN: Export tickets to CSV
// ─────────────────────────────────────────────────────────────

export const exportTickets: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      throw new AppError("Forbidden: Admin access required", 403);
    }

    const tickets = await Ticket.find()
      .populate("userId", "email name")
      .populate("eventId", "title date venue")
      .populate("orderId", "orderNumber totalAmount")
      .sort({ createdAt: -1 })
      .lean();

    const csvData = tickets.map((ticket: any) => ({
      TicketID: ticket.ticketId,
      CustomerEmail: ticket.userId?.email || "N/A",
      CustomerName: ticket.userId?.name || "N/A",
      EventTitle: ticket.eventId?.title || "N/A",
      EventDate: ticket.eventId?.date ? new Date(ticket.eventId.date).toISOString() : "N/A",
      Venue: ticket.eventId?.venue || "N/A",
      Quantity: ticket.quantity,
      Status: ticket.status,
      OrderNumber: ticket.orderId?.orderNumber || "N/A",
      OrderAmount: ticket.orderId?.totalAmount || 0,
      PurchasedAt: new Date(ticket.createdAt).toISOString(),
    }));

    const csv = arrayToCSV(csvData);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="tickets-${Date.now()}.csv"`);
    return res.send(csv);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN: Export art to CSV
// ─────────────────────────────────────────────────────────────

export const exportArt: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      throw new AppError("Forbidden: Admin access required", 403);
    }

    const arts = await Art.find()
      .sort({ createdAt: -1 })
      .lean();

    const csvData = arts.map((art) => ({
      ID: art._id,
      Title: art.title,
      Artist: art.artist,
      Category: art.category || "N/A",
      Price: art.price,
      Quantity: art.quantity,
      FrameSizes: art.frameSizes?.map((f: any) => `${f.name} (${f.width}x${f.height}${f.unit})`).join("; ") || "N/A",
      IsFeatured: art.isFeatured ? "Yes" : "No",
      IsAvailable: art.isAvailable ? "Yes" : "No",
      ImagesCount: art.images?.length || 0,
      CreatedAt: new Date(art.createdAt).toISOString(),
    }));

    const csv = arrayToCSV(csvData);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="art-${Date.now()}.csv"`);
    return res.send(csv);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN: Export events to CSV
// ─────────────────────────────────────────────────────────────

export const exportEvents: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      throw new AppError("Forbidden: Admin access required", 403);
    }

    const events = await Event.find()
      .sort({ date: -1 })
      .lean();

    const csvData = events.map((event) => ({
      ID: event._id,
      Title: event.title,
      Venue: event.venue,
      Date: new Date(event.date).toISOString().split("T")[0],
      StartTime: event.startTime,
      TicketPrice: event.ticketPrice,
      TotalSeats: event.totalSeats,
      SeatsLeft: event.seatsLeft,
      SeatsSold: event.totalSeats - event.seatsLeft,
      IsFeatured: event.isFeatured ? "Yes" : "No",
      Status: event.seatsLeft === 0 ? "Sold Out" : "Available",
      CreatedAt: new Date(event.createdAt).toISOString(),
    }));

    const csv = arrayToCSV(csvData);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="events-${Date.now()}.csv"`);
    return res.send(csv);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN: Export users to CSV
// ─────────────────────────────────────────────────────────────

export const exportUsers: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      throw new AppError("Forbidden: Admin access required", 403);
    }

    const users = await User.find()
      .sort({ createdAt: -1 })
      .lean();

    const csvData = users.map((user: any) => ({
      ID: user._id,
      Email: user.email,
      Name: user.name || "N/A",
      Role: user.role,
      Phone: user.phone || "N/A",
      HasProfileImage: user.profileImage ? "Yes" : "No",
      CreatedAt: user.createdAt ? new Date(user.createdAt).toISOString() : "N/A",
    }));

    const csv = arrayToCSV(csvData);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="users-${Date.now()}.csv"`);
    return res.send(csv);
  } catch (err) {
    next(err);
  }
};
