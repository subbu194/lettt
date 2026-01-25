import mongoose, { Schema, Types } from "mongoose";

export type TicketStatus = "active" | "used" | "cancelled" | "expired";

export interface TicketDocument extends mongoose.Document {
  userId: Types.ObjectId;
  eventId: Types.ObjectId;
  orderId: Types.ObjectId;
  ticketId: string;
  quantity: number;
  status: TicketStatus;
  createdAt: Date;
  updatedAt: Date;
}

const TicketSchema = new Schema<TicketDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    ticketId: { type: String, required: true, unique: true },
    quantity: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ["active", "used", "cancelled", "expired"], default: "active" },
  },
  { timestamps: true }
);

// Compound indexes for common queries (remove duplicate single-field indexes)
TicketSchema.index({ userId: 1, status: 1 });
TicketSchema.index({ userId: 1, createdAt: -1 });
TicketSchema.index({ eventId: 1, status: 1 });

export const Ticket = mongoose.model<TicketDocument>("Ticket", TicketSchema);
