import mongoose, { Document, Schema } from "mongoose";

export interface ITalkShowVideo extends Document {
  title: string;
  description: string;
  youtubeUrl: string;
  season: number;
  episodeNumber?: number;
  thumbnail?: string;
  duration?: string;
  isFeatured: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const talkShowVideoSchema = new Schema<ITalkShowVideo>(
  {
    title: {
      type: String,
      required: [true, "Video title is required"],
      trim: true,
      minlength: 2,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    youtubeUrl: {
      type: String,
      required: [true, "YouTube URL is required"],
      trim: true,
    },
    season: {
      type: Number,
      required: [true, "Season number is required"],
      min: 1,
    },
    episodeNumber: {
      type: Number,
      min: 1,
    },
    thumbnail: {
      type: String,
      trim: true,
    },
    duration: {
      type: String,
      trim: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
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

// Index for faster queries
talkShowVideoSchema.index({ season: 1, episodeNumber: 1 });
talkShowVideoSchema.index({ isFeatured: 1 });
talkShowVideoSchema.index({ createdAt: -1 });
talkShowVideoSchema.index(
  { title: "text", description: "text" },
  { weights: { title: 10, description: 2 } }
);

export const TalkShowVideo = mongoose.model<ITalkShowVideo>(
  "TalkShowVideo",
  talkShowVideoSchema
);
