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
  userId: Types.ObjectId;
  items: OrderItem[];
  totalAmount: number;
  paymentStatus: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  address: string;
  phone: string;
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
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [OrderItemSchema], required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentStatus: { type: String, enum: ["created", "paid", "failed"], default: "created" },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    address: { type: String, required: true },
    phone: { type: String, required: true },
  },
  { timestamps: true }
);

export const Order = mongoose.model<OrderDocument>("Order", OrderSchema);
