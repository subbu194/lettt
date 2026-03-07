import mongoose, { Document, Schema } from "mongoose";

export interface IGalleryImage extends Document {
  imageUrl: string;
  category: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const galleryImageSchema = new Schema<IGalleryImage>(
  {
    imageUrl: {
      type: String,
      required: [true, "Image URL is required"],
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      default: "General",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

galleryImageSchema.index({ category: 1, createdAt: -1 });
galleryImageSchema.index({ createdAt: -1 });
galleryImageSchema.index(
  { category: "text" },
  { weights: { category: 10 } }
);

export const GalleryImage = mongoose.model<IGalleryImage>(
  "GalleryImage",
  galleryImageSchema
);
