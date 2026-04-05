import type { RequestHandler } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import { Blog } from "../models/Blog";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";

// ─────────────────────────────────────────────────────────────
// Slug helper
// ─────────────────────────────────────────────────────────────

function toSlugBase(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
  const base = toSlugBase(title);
  let slug = base;
  let counter = 1;

  while (counter < 100) {
    const filter: Record<string, unknown> = { slug };
    if (excludeId) filter._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
    const existing = await Blog.findOne(filter).select("_id").lean();
    if (!existing) return slug;
    slug = `${base}-${counter++}`;
  }

  return `${base}-${Date.now()}`;
}

// ─────────────────────────────────────────────────────────────
// Validation Schemas
// ─────────────────────────────────────────────────────────────

const contentBlockSchema = z.object({
  type: z.enum(["paragraph", "heading", "image", "quote", "divider"]),
  text: z.string().optional(),
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  url: z.string().optional(),
  caption: z.string().optional(),
  align: z.enum(["left", "right", "center", "full"]).optional().default("center"),
});

const createBlogSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  excerpt: z
    .string()
    .min(10, "Excerpt must be at least 10 characters")
    .max(400, "Excerpt max 400 characters"),
  subject: z.string().min(2, "Subject must be at least 2 characters"),
  coverImage: z.string().url("Cover image must be a valid URL"),
  logo: z.string().url("Logo must be a valid URL").optional(),
  extraImages: z
    .array(z.string().url("Each extra image must be a valid URL"))
    .default([]),
  content: z.array(contentBlockSchema).default([]),
  tags: z.array(z.string()).default([]),
  isFeatured: z.boolean().optional().default(false),
  isPublished: z.boolean().optional().default(false),
});

const updateBlogSchema = createBlogSchema.partial();

const listQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(50).optional().default(12),
  tag: z.string().optional(),
  search: z.string().optional(),
  featured: z.coerce.boolean().optional(),
  published: z.coerce.boolean().optional(),
  sortBy: z.enum(["createdAt", "title"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

// ─────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────

function isValidObjectId(id: string | undefined): id is string {
  if (!id) return false;
  return mongoose.Types.ObjectId.isValid(id);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─────────────────────────────────────────────────────────────
// PUBLIC: List published blogs (paginated)
// ─────────────────────────────────────────────────────────────

export const listBlogs: RequestHandler = async (req, res, next) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const { page, limit, tag, search, featured, sortBy, sortOrder } = query;

    const filter: Record<string, unknown> = { isPublished: true };
    if (tag) filter.tags = tag;
    if (featured !== undefined) filter.isFeatured = featured;
    if (search) {
      const safe = escapeRegex(search);
      filter.$or = [
        { title: { $regex: safe, $options: "i" } },
        { excerpt: { $regex: safe, $options: "i" } },
        { subject: { $regex: safe, $options: "i" } },
        { tags: { $regex: safe, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const sortDir = sortOrder === "asc" ? 1 : -1;

    const [items, total] = await Promise.all([
      Blog.find(filter)
        .select("-content") // omit heavy content for list view
        .sort({ [sortBy]: sortDir })
        .skip(skip)
        .limit(limit)
        .lean(),
      Blog.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.json({
      items,
      pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// PUBLIC: Featured blogs (for homepage/sidebar, max 6)
// ─────────────────────────────────────────────────────────────

export const listFeaturedBlogs: RequestHandler = async (_req, res, next) => {
  try {
    const blogs = await Blog.find({ isPublished: true, isFeatured: true })
      .select("-content")
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    return res.json({ items: blogs });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// PUBLIC: Get blog by slug (full content for detail page)
// ─────────────────────────────────────────────────────────────

export const getBlogBySlug: RequestHandler = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const blog = await Blog.findOne({ slug, isPublished: true }).lean();
    if (!blog) return next(new AppError("Blog not found", 404));
    return res.json(blog);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// PUBLIC/ADMIN: Get blog by ID
// ─────────────────────────────────────────────────────────────

export const getBlogById: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return next(new AppError("Invalid blog ID", 400));

    const blog = await Blog.findById(id).lean();
    if (!blog) return next(new AppError("Blog not found", 404));
    return res.json(blog);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN: List all blogs (including unpublished)
// ─────────────────────────────────────────────────────────────

export const adminListBlogs: RequestHandler = async (req, res, next) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const { page, limit, tag, search, featured, published, sortBy, sortOrder } = query;

    const filter: Record<string, unknown> = {};
    if (tag) filter.tags = tag;
    if (featured !== undefined) filter.isFeatured = featured;
    if (published !== undefined) filter.isPublished = published;
    if (search) {
      const safe = escapeRegex(search);
      filter.$or = [
        { title: { $regex: safe, $options: "i" } },
        { excerpt: { $regex: safe, $options: "i" } },
        { subject: { $regex: safe, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const sortDir = sortOrder === "asc" ? 1 : -1;

    const [items, total] = await Promise.all([
      Blog.find(filter)
        .select("-content")
        .sort({ [sortBy]: sortDir })
        .skip(skip)
        .limit(limit)
        .lean(),
      Blog.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);
    return res.json({
      items,
      pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN: Create blog
// ─────────────────────────────────────────────────────────────

export const createBlog: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      throw new AppError("Forbidden: Admin access required", 403);
    }

    const data = createBlogSchema.parse(req.body);
    
    let slug = await generateUniqueSlug(data.title);
    let blog;
    let retries = 3;

    while (retries > 0) {
      try {
        blog = await Blog.create({
          ...data,
          slug,
          createdBy: req.user.userId,
        });
        break;
      } catch (err: any) {
        if (err.code === 11000 && err.keyPattern?.slug) {
          logger.warn(`Slug collision for ${slug}, retrying...`);
          slug = await generateUniqueSlug(data.title + "-" + Math.floor(Math.random() * 1000));
          retries--;
          if (retries === 0) throw err;
        } else {
          throw err;
        }
      }
    }

    return res.status(201).json({ blog });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN: Update blog
// ─────────────────────────────────────────────────────────────

export const updateBlog: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return next(new AppError("Invalid blog ID", 400));

    const data = updateBlogSchema.parse(req.body);

    // Regenerate slug if title changed
    if (data.title) {
      (data as Record<string, unknown>).slug = await generateUniqueSlug(data.title, id);
    }

    const blog = await Blog.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after', runValidators: true }).lean();
    if (!blog) return next(new AppError("Blog not found", 404));
    return res.json(blog);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN: Delete blog
// ─────────────────────────────────────────────────────────────

export const deleteBlog: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return next(new AppError("Invalid blog ID", 400));

    // Get the details BEFORE deleting so we can clean up R2 Storage
    const blogToDelete = await Blog.findById(id);
    if (!blogToDelete) return next(new AppError("Blog not found", 404));

    const blog = await Blog.findByIdAndDelete(id);
    
    // Automatically wipe all associated images from R2 Storage
    if (blog) {
      const { deleteFileFromR2 } = await import("../utils/fileUpload");
      const urlsToDelete: string[] = [];

      if (blog.coverImage) urlsToDelete.push(blog.coverImage);
      if (blog.logo) urlsToDelete.push(blog.logo);

      // Also delete extraImages from R2 storage
      if (Array.isArray(blog.extraImages)) {
        blog.extraImages.forEach(url => {
          if (url) urlsToDelete.push(url);
        });
      }
      
      // Also delete any images embedded directly inside the blog's rich text content blocks
      if (Array.isArray(blog.content)) {
        blog.content.forEach(block => {
          if (block.type === 'image' && block.url) {
            urlsToDelete.push(block.url);
          }
        });
      }

      if (urlsToDelete.length > 0) {
        Promise.all(urlsToDelete.map(async (url) => {
          try {
            await deleteFileFromR2(url);
          } catch (e) {
            console.error(`Failed to delete blog asset ${url} from R2:`, e);
          }
        })).catch(console.error);
      }
    }

    return res.json({ message: "Blog deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN: Toggle published
// ─────────────────────────────────────────────────────────────

export const togglePublished: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return next(new AppError("Invalid blog ID", 400));

    const blog = await Blog.findById(id);
    if (!blog) return next(new AppError("Blog not found", 404));

    blog.isPublished = !blog.isPublished;
    await blog.save();
    return res.json({ isPublished: blog.isPublished, message: `Blog ${blog.isPublished ? "published" : "unpublished"}` });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN: Toggle featured
// ─────────────────────────────────────────────────────────────

export const toggleFeatured: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return next(new AppError("Invalid blog ID", 400));

    const blog = await Blog.findById(id);
    if (!blog) return next(new AppError("Blog not found", 404));

    blog.isFeatured = !blog.isFeatured;
    await blog.save();
    return res.json({ isFeatured: blog.isFeatured, message: `Blog ${blog.isFeatured ? "featured" : "unfeatured"}` });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN: Stats
// ─────────────────────────────────────────────────────────────

export const getBlogStats: RequestHandler = async (_req, res, next) => {
  try {
    const [total, published, featured] = await Promise.all([
      Blog.countDocuments(),
      Blog.countDocuments({ isPublished: true }),
      Blog.countDocuments({ isFeatured: true }),
    ]);

    return res.json({ total, published, drafts: total - published, featured });
  } catch (err) {
    next(err);
  }
};
