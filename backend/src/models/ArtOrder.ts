import mongoose, { Schema, Types } from "mongoose";

export type ArtOrderStatus = "created" | "paid" | "failed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";

export interface ArtOrderItem {
  artId: Types.ObjectId;
  title: string;
  artist: string;
  image: string;
  quantity: number;
  unitPrice: number;
  frameSize?: string;
}

export interface ArtOrderDocument extends mongoose.Document {
  orderNumber: string;
  userId: Types.ObjectId;
  items: ArtOrderItem[];
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  orderStatus: ArtOrderStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paymentCapturedAt?: Date;
  lastWebhookEventKey?: string;
  shippingAddress: string;
  phone: string;
  trackingNumber?: string;
  shippedAt?: Date;
  deliveredAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ArtOrderItemSchema = new Schema<ArtOrderItem>(
  {
    artId: { type: Schema.Types.ObjectId, ref: "Art", required: true },
    title: { type: String, required: true },
    artist: { type: String, required: true },
    image: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    frameSize: { type: String },
  },
  { _id: false }
);

const ArtOrderSchema = new Schema<ArtOrderDocument>(
  {
    orderNumber: { type: String, unique: true, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [ArtOrderItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    orderStatus: { 
      type: String, 
      enum: ["created", "paid", "failed", "processing", "shipped", "delivered", "cancelled", "refunded"], 
      default: "created" 
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    paymentCapturedAt: { type: Date },
    lastWebhookEventKey: { type: String },
    shippingAddress: { type: String, required: true },
    phone: { type: String, required: true },
    trackingNumber: { type: String },
    shippedAt: { type: Date },
    deliveredAt: { type: Date },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Generate unique order number before validation
ArtOrderSchema.pre("validate", function () {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.orderNumber = `ART-${timestamp}-${random}`;
  }
});

// Indexes
ArtOrderSchema.index({ userId: 1, createdAt: -1 });
ArtOrderSchema.index({ orderStatus: 1, createdAt: -1 });
ArtOrderSchema.index({ razorpayOrderId: 1 }, { sparse: true });
ArtOrderSchema.index({ razorpayPaymentId: 1 }, { sparse: true, unique: true });
ArtOrderSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });

export const ArtOrder = mongoose.model<ArtOrderDocument>("ArtOrder", ArtOrderSchema);
