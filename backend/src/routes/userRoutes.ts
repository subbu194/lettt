import { Router } from "express";
import {
  getProfile,
  updateProfileDetails,
  updateEmail,
  updatePassword,
  deleteAccount,
} from "../controllers/userController";
import { authenticateUser } from "../middleware/auth";

const router = Router();

// All routes require authentication
router.use(authenticateUser);

// Profile management
router.get("/profile", getProfile);
router.put("/profile/details", updateProfileDetails);
router.put("/profile/email", updateEmail);
router.put("/profile/password", updatePassword);
router.delete("/profile", deleteAccount);

export default router;
