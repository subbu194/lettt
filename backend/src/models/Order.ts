import mongoose, { Schema, Types } from "mongoose";

export type OrderItemType = "art" | "event";
export type PaymentStatus = "created" | "paid" | "failed";

export interface OrderItem {
  itemType: OrderItemType;
  itemId: string; // ObjectId string
  title: string;
  quantity: number;
  price: number; // per-unit price
}

export interface OrderDocument extends mongoose.Document {
  orderNumber: string;
  userId: Types.ObjectId;
  items: OrderItem[];
  totalAmount: number;
  paymentStatus: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paymentCapturedAt?: Date;
  lastWebhookEventKey?: string;
  address: string;
  phone: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<OrderItem>(
  {
    itemType: { type: String, enum: ["art", "event"], required: true },
    itemId: { type: String, required: true },
    title: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const OrderSchema = new Schema<OrderDocument>(
  {
    orderNumber: { type: String, unique: true, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [OrderItemSchema], required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentStatus: { type: String, enum: ["created", "paid", "failed"], default: "created" },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    paymentCapturedAt: { type: Date },
    lastWebhookEventKey: { type: String },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    // TTL field: only set for "created" orders, cleared when paid/failed
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Generate unique order number before validation so required checks pass.
OrderSchema.pre("validate", function () {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.orderNumber = `ORD-${timestamp}-${random}`;
  }
});

// Compound indexes (more efficient than separate indexes)
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ paymentStatus: 1, createdAt: -1 });
OrderSchema.index({ razorpayOrderId: 1 }, { sparse: true }); // Sparse because it's optional
OrderSchema.index({ razorpayPaymentId: 1 }, { sparse: true, unique: true });
// TTL: MongoDB auto-deletes documents when expiresAt is reached
// Only "created" orders have expiresAt set, so only abandoned orders get deleted
OrderSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });

export const Order = mongoose.model<OrderDocument>("Order", OrderSchema);
