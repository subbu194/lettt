import { Router } from "express";
import {
  adminLogin,
  getProfile,
  login,
  logout,
  signup,
  updateProfile,
} from "../controllers/authController";
import { authenticateUser, blockIfAuthenticatedAsUser } from "../middleware/auth";

const router = Router();

// User auth
router.post("/signup", signup);
router.post("/login", login);

// Backward-compatible alias used by current frontend
router.post("/register", signup);

router.post("/logout", logout);

// Token verification endpoint
router.get("/verify", authenticateUser, (_req, res) => {
  return res.status(200).json({ valid: true });
});

router.get("/profile", authenticateUser, getProfile);
router.put("/profile", authenticateUser, updateProfile);

// Admin auth (hidden in UI)
router.post("/admin/login", blockIfAuthenticatedAsUser, adminLogin);

export default router;
