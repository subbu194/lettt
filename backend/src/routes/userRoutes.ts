import { Router } from "express";
import {
  getProfile,
  updateProfileDetails,
  updateEmail,
  updatePassword,
  deleteAccount,
  getAllUsers,
} from "../controllers/userController";
import { authenticateUser, authenticateAdmin } from "../middleware/auth";

const router = Router();

// Admin routes (must be before generic authenticateUser middleware if we want to avoid double auth, or just handle it here)
router.get("/admin/all", authenticateAdmin, getAllUsers);

// All routes below require authentication
router.use(authenticateUser);

// Profile management
router.get("/profile", getProfile);
router.put("/profile/details", updateProfileDetails);
router.put("/profile/email", updateEmail);
router.put("/profile/password", updatePassword);
router.delete("/profile", deleteAccount);

export default router;
