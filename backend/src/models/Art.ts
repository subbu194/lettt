import mongoose, { Schema, Types } from "mongoose";

export interface FrameSize {
  name: string;
  width: number;
  height: number;
  unit: string; // 'cm' or 'inch'
}

export interface ArtDocument extends mongoose.Document {
  title: string;
  description: string;
  artist: string;
  images: string[]; // Max 10 images, first is main
  frameSizes: FrameSize[]; // Custom frame sizes with dimensions
  price: number;
  category?: string;
  isFeatured: boolean;
  isAvailable: boolean;
  quantity: number; // Available quantity
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FrameSizeSchema = new Schema({
  name: { type: String, required: true },
  width: { type: Number, required: true, min: 0 },
  height: { type: Number, required: true, min: 0 },
  unit: { type: String, enum: ['cm', 'inch'], default: 'cm' },
}, { _id: false });

const ArtSchema = new Schema<ArtDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    artist: { type: String, required: true, trim: true },
    images: { 
      type: [String], 
      default: [],
      validate: {
        validator: function(arr: string[]) {
          return arr.length <= 10;
        },
        message: 'Maximum 10 images allowed'
      }
    },
    frameSizes: { type: [FrameSizeSchema], default: [] },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, trim: true },
    isFeatured: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
    quantity: { type: Number, default: 1, min: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// Compound indexes for efficient queries
ArtSchema.index({ category: 1, isAvailable: 1 });
ArtSchema.index({ artist: 1, isAvailable: 1 });
ArtSchema.index({ isFeatured: 1, isAvailable: 1 });
ArtSchema.index({ price: 1, isAvailable: 1 });
ArtSchema.index(
  { title: "text", artist: "text", description: "text", category: "text" },
  { weights: { title: 10, artist: 6, category: 4, description: 2 } }
);

export const Art = mongoose.model<ArtDocument>("Art", ArtSchema);
