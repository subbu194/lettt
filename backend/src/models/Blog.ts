import mongoose, { Schema, Types } from "mongoose";

// ─────────────────────────────────────────────────────────────
// Content Block Types
// Allows the admin to compose rich magazine-style blog content
// with text, headings, images (with text-wrap control), and quotes.
// ─────────────────────────────────────────────────────────────

export type BlockType = "paragraph" | "heading" | "image" | "quote" | "divider";
export type ImageAlign = "left" | "right" | "center" | "full";
export type HeadingLevel = 1 | 2 | 3;

export interface ContentBlock {
  type: BlockType;
  // paragraph / heading / quote
  text?: string;
  // heading level
  level?: HeadingLevel;
  // image block
  url?: string;
  caption?: string;
  align?: ImageAlign; // left/right → text wraps; center/full → full-width
}

export interface BlogDocument extends mongoose.Document {
  title: string;
  slug: string;
  excerpt: string;
  subject: string; // person / company the blog is about
  coverImage: string;
  logo?: string; // optional logo (company logo, etc.)
  extraImages: string[]; // additional images for the blog
  content: ContentBlock[]; // ordered rich-content blocks
  tags: string[];
  isFeatured: boolean;
  isPublished: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────────────────────
// Content Block Sub-schema
// ─────────────────────────────────────────────────────────────

const ContentBlockSchema = new Schema<ContentBlock>(
  {
    type: {
      type: String,
      enum: ["paragraph", "heading", "image", "quote", "divider"],
      required: true,
    },
    text: { type: String },
    level: { type: Number, enum: [1, 2, 3] },
    url: { type: String },
    caption: { type: String },
    align: {
      type: String,
      enum: ["left", "right", "center", "full"],
      default: "center",
    },
  },
  { _id: false }
);

// ─────────────────────────────────────────────────────────────
// Blog Schema
// ─────────────────────────────────────────────────────────────

const BlogSchema = new Schema<BlogDocument>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    excerpt: { type: String, required: true, trim: true, maxlength: 400 },
    subject: { type: String, required: true, trim: true },
    coverImage: { type: String, required: true },
    logo: { type: String },
    extraImages: {
      type: [String],
      default: [],
    },
    content: { type: [ContentBlockSchema], default: [] },
    tags: { type: [String], default: [] },
    isFeatured: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// ─────────────────────────────────────────────────────────────
// Indexes (slug index is implicit via unique:true on the field)
// ─────────────────────────────────────────────────────────────
BlogSchema.index({ isPublished: 1, createdAt: -1 });
BlogSchema.index({ isFeatured: 1, isPublished: 1 });
BlogSchema.index({ tags: 1, isPublished: 1 });
BlogSchema.index(
  { title: "text", excerpt: "text", subject: "text", tags: "text" },
  { weights: { title: 10, subject: 6, tags: 4, excerpt: 2 } }
);

export const Blog = mongoose.model<BlogDocument>("Blog", BlogSchema);
