import mongoose, { Schema, Types } from "mongoose";

export interface ArtistDocument extends mongoose.Document {
  name: string;
  image?: string;
  artType: string;
  grade: string; // e.g., 'Beginner', 'Intermediate', 'Advanced', 'Expert'
  phone: string;
  whatsapp: string;
  bio?: string;
  isActive: boolean;
  featured: boolean;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ArtistSchema = new Schema<ArtistDocument>(
  {
    name: { type: String, required: true, trim: true },
    image: { type: String, trim: true },
    artType: { type: String, required: true, trim: true },
    grade: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    whatsapp: { type: String, required: true, trim: true },
    bio: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Indexes for efficient queries
ArtistSchema.index({ isActive: 1 });
ArtistSchema.index({ featured: 1, isActive: 1 });
ArtistSchema.index({ artType: 1 });
ArtistSchema.index({ grade: 1 });
ArtistSchema.index({ name: "text" });

export const Artist = mongoose.model<ArtistDocument>("Artist", ArtistSchema);
