import type { RequestHandler } from "express";
import { z } from "zod";
import { AppError } from "../middleware/errorHandler";
import { generateUploadUrlProfile, deleteFileFromR2 } from "../utils/fileUpload";

// Schema for getting presigned upload URL
const getUploadUrlSchema = z.object({
  fileType: z.string().min(1, "File type is required"),
  fileName: z.string().min(1, "File name is required"),
  folder: z.string().optional().default("uploads"),
});

// Schema for deleting a file
const deleteFileSchema = z.object({
  fileUrl: z.string().url("Valid file URL is required"),
});

// ─────────────────────────────────────────────────────────────
// Get Presigned Upload URL (Admin only)
// ─────────────────────────────────────────────────────────────
export const getUploadUrl: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    if (req.user.role !== "admin") {
      throw new AppError("Forbidden: Admin access required", 403);
    }

    const { fileType, fileName, folder } = getUploadUrlSchema.parse(req.body);

    // Validate file type - accept common image and video formats
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/bmp",
      "image/svg+xml",
      "video/mp4",
      "video/quicktime",
      "video/webm",
    ];

    const isImageType = fileType.startsWith("image/");
    const isVideoType = fileType.startsWith("video/");
    const isAllowedType = allowedTypes.includes(fileType) || isImageType || isVideoType;

    if (!isAllowedType) {
      throw new AppError("File type not supported. Allowed types: images and videos", 400);
    }

    // Generate presigned URL for uploading
    const { uploadUrl, publicUrl } = await generateUploadUrlProfile(
      fileType,
      fileName,
      folder,
      req.user.userId,
      true // permanent storage
    );

    return res.status(200).json({
      success: true,
      uploadUrl,
      publicUrl,
      fileType,
      fileName,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// Get Presigned Upload URL for Profile Image (User)
// ─────────────────────────────────────────────────────────────
export const getProfileImageUploadUrl: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const { fileType, fileName } = getUploadUrlSchema.parse(req.body);

    // Only allow image uploads for profile
    if (!fileType.startsWith("image/")) {
      throw new AppError("Only image files are allowed for profile pictures", 400);
    }

    // Generate presigned URL for uploading to profile-images folder
    const { uploadUrl, publicUrl } = await generateUploadUrlProfile(
      fileType,
      fileName,
      "profile-images",
      req.user.userId,
      true // permanent storage
    );

    return res.status(200).json({
      success: true,
      uploadUrl,
      publicUrl,
      fileType,
      fileName,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// Delete File from R2 (Admin only)
// ─────────────────────────────────────────────────────────────
export const deleteFile: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    if (req.user.role !== "admin") {
      throw new AppError("Forbidden: Admin access required", 403);
    }

    const { fileUrl } = deleteFileSchema.parse(req.body);

    await deleteFileFromR2(fileUrl);

    return res.status(200).json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};
