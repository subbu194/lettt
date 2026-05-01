import type { RequestHandler } from "express";
import { AppError } from "../middleware/errorHandler";
import { ArtOrder } from "../models/ArtOrder";
import { TicketBooking } from "../models/TicketBooking";
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
      let value = String(row[header] ?? "");
      // CSV Injection prevention: prefix dangerous characters with a single quote
      // so Excel/Sheets won't interpret them as formulas
      if (/^[=+\-@\t\r]/.test(value)) {
        value = `'${value}`;
      }
      // Escape quotes and always wrap in quotes for safety
      const escaped = value.replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(","));
  }

  return csvRows.join("\n");
}

// ─────────────────────────────────────────────────────────────
// ADMIN: Export art orders to CSV
// ─────────────────────────────────────────────────────────────

export const exportOrders: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      throw new AppError("Forbidden: Admin access required", 403);
    }

    const orders = await ArtOrder.find()
      .populate("userId", "email name")
      .sort({ createdAt: -1 })
      .lean();

    const csvData = orders.map((order: any) => ({
      OrderNumber: order.orderNumber || "N/A",
      OrderID: order._id,
      CustomerEmail: order.userId?.email || "N/A",
      CustomerName: order.userId?.name || "N/A",
      TotalAmount: order.totalAmount,
      Subtotal: order.subtotal,
      ShippingFee: order.shippingFee,
      OrderStatus: order.orderStatus,
      Items: order.items.map((i: any) => `${i.title} by ${i.artist} (${i.quantity}x)`).join("; "),
      Phone: order.phone,
      ShippingAddress: order.shippingAddress,
      TrackingNumber: order.trackingNumber || "N/A",
      RazorpayOrderID: order.razorpayOrderId || "N/A",
      RazorpayPaymentID: order.razorpayPaymentId || "N/A",
      CreatedAt: new Date(order.createdAt).toISOString(),
    }));

    const csv = arrayToCSV(csvData);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="art-orders-${Date.now()}.csv"`);
    return res.send(csv);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN: Export ticket bookings to CSV
// ─────────────────────────────────────────────────────────────

export const exportTicketBookings: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      throw new AppError("Forbidden: Admin access required", 403);
    }

    const bookings = await TicketBooking.find()
      .populate("userId", "email name")
      .populate("eventId", "title date venue")
      .sort({ createdAt: -1 })
      .lean();

    const csvData = bookings.map((booking: any) => ({
      BookingNumber: booking.bookingNumber || "N/A",
      BookingID: booking._id,
      CustomerEmail: booking.userId?.email || "N/A",
      CustomerName: booking.userId?.name || "N/A",
      EventTitle: booking.eventId?.title || "N/A",
      EventDate: booking.eventId?.date ? new Date(booking.eventId.date).toISOString() : "N/A",
      Venue: booking.eventId?.venue || "N/A",
      Quantity: booking.quantity,
      UnitPrice: booking.unitPrice,
      TotalAmount: booking.totalAmount,
      BookingStatus: booking.bookingStatus,
      Phone: booking.phone,
      RazorpayOrderID: booking.razorpayOrderId || "N/A",
      RazorpayPaymentID: booking.razorpayPaymentId || "N/A",
      CreatedAt: new Date(booking.createdAt).toISOString(),
    }));

    const csv = arrayToCSV(csvData);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="ticket-bookings-${Date.now()}.csv"`);
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
      .sort({ createdAt: -1 })
      .lean();

    // Get booking info for each ticket
    const bookingIds = tickets.map((t: any) => t.orderId).filter(Boolean);
    const bookings = await TicketBooking.find({ _id: { $in: bookingIds } }).lean();
    const bookingMap = new Map(bookings.map((b: any) => [b._id.toString(), b]));

    const csvData = tickets.map((ticket: any) => {
      const booking = bookingMap.get(ticket.orderId?.toString());
      return {
        TicketID: ticket.ticketId,
        CustomerEmail: ticket.userId?.email || "N/A",
        CustomerName: ticket.userId?.name || "N/A",
        EventTitle: ticket.eventId?.title || "N/A",
        EventDate: ticket.eventId?.date ? new Date(ticket.eventId.date).toISOString() : "N/A",
        Venue: ticket.eventId?.venue || "N/A",
        Quantity: ticket.quantity,
        Status: ticket.status,
        BookingNumber: booking?.bookingNumber || "N/A",
        BookingAmount: booking?.totalAmount || 0,
        PurchasedAt: new Date(ticket.createdAt).toISOString(),
      };
    });

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
