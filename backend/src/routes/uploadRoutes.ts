import { Router } from "express";
import { getUploadUrl, deleteFile, getProfileImageUploadUrl } from "../controllers/uploadController";
import { authenticateAdmin, authenticateUser } from "../middleware/auth";

const router = Router();

// Admin upload routes
// POST /api/v1/upload/url - Get presigned URL for file upload (Admin only)
router.post("/url", authenticateAdmin, getUploadUrl);

// DELETE /api/v1/upload/file - Delete a file from R2 (Admin only)
router.delete("/file", authenticateAdmin, deleteFile);

// User upload routes
// POST /api/v1/upload/profile-image - Get presigned URL for profile image upload
router.post("/profile-image", authenticateUser, getProfileImageUploadUrl);

export default router;
