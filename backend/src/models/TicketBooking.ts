import mongoose, { Schema, Types } from "mongoose";

export type TicketBookingStatus = "created" | "paid" | "failed" | "cancelled" | "refunded";

export interface TicketBookingDocument extends mongoose.Document {
  bookingNumber: string;
  userId: Types.ObjectId;
  eventId: Types.ObjectId;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  bookingStatus: TicketBookingStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paymentCapturedAt?: Date;
  lastWebhookEventKey?: string;
  phone: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TicketBookingSchema = new Schema<TicketBookingDocument>(
  {
    bookingNumber: { type: String, unique: true, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    bookingStatus: { 
      type: String, 
      enum: ["created", "paid", "failed", "cancelled", "refunded"], 
      default: "created" 
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    paymentCapturedAt: { type: Date },
    lastWebhookEventKey: { type: String },
    phone: { type: String, required: true },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Generate unique booking number before validation
TicketBookingSchema.pre("validate", function () {
  if (!this.bookingNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.bookingNumber = `TKB-${timestamp}-${random}`;
  }
});

// Indexes
TicketBookingSchema.index({ userId: 1, createdAt: -1 });
TicketBookingSchema.index({ eventId: 1, bookingStatus: 1 });
TicketBookingSchema.index({ bookingStatus: 1, createdAt: -1 });
TicketBookingSchema.index({ razorpayOrderId: 1 }, { sparse: true });
TicketBookingSchema.index({ razorpayPaymentId: 1 }, { sparse: true, unique: true });
TicketBookingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });

export const TicketBooking = mongoose.model<TicketBookingDocument>("TicketBooking", TicketBookingSchema);
