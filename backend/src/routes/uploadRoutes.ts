import { Router } from "express";
import { getUploadUrl, deleteFile } from "../controllers/uploadController";
import { authenticateAdmin } from "../middleware/auth";

const router = Router();

// All upload routes require admin authentication
// POST /api/v1/upload/url - Get presigned URL for file upload
router.post("/url", authenticateAdmin, getUploadUrl);

// DELETE /api/v1/upload/file - Delete a file from R2
router.delete("/file", authenticateAdmin, deleteFile);

export default router;
