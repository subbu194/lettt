import mongoose, { Schema, Types } from "mongoose";

export interface EventDocument extends mongoose.Document {
  title: string;
  description: string;
  coverImage: string;
  galleryImages: string[];
  venue: string;
  date: Date; // Changed to Date type
  startTime: string; // e.g., "18:00"
  ticketPrice: number;
  totalSeats: number;
  seatsLeft: number;
  isFeatured: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<EventDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    coverImage: { type: String, required: true },
    galleryImages: { 
      type: [String], 
      default: [],
      validate: {
        validator: function(arr: string[]) {
          return arr.length <= 10;
        },
        message: 'Maximum 10 gallery images allowed'
      }
    },
    venue: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    ticketPrice: { type: Number, required: true, min: 0 },
    totalSeats: { type: Number, required: true, min: 0 },
    seatsLeft: { type: Number, required: true, min: 0 },
    isFeatured: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

EventSchema.pre("validate", function (next) {
  if (this.isModified("totalSeats") && !this.isModified("seatsLeft")) {
    this.seatsLeft = this.totalSeats;
  }
  next();
});

// Compound indexes for efficient queries
EventSchema.index({ date: 1, venue: 1 });
EventSchema.index({ date: 1, seatsLeft: 1 });
EventSchema.index({ isFeatured: 1, date: 1 });
EventSchema.index(
  { title: "text", venue: "text", description: "text" },
  { weights: { title: 10, venue: 6, description: 2 } }
);

export const Event = mongoose.model<EventDocument>("Event", EventSchema);
