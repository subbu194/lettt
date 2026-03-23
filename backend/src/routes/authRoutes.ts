import { Router } from "express";
import {
  adminLogin,
  getProfile,
  login,
  logout,
  signup,
  updateProfile,
  completeProfile,
  refreshUserToken,
  refreshAdminToken,
} from "../controllers/authController";
import { authenticateUser, authenticateAdmin, blockIfAuthenticatedAsUser } from "../middleware/auth";

const router = Router();

// User auth
router.post("/signup", signup);
router.post("/login", login);
router.post("/register", signup);
router.post("/refresh", refreshUserToken);

router.post("/logout", (req, res, next) => {
  req.query.type = "user";
  logout(req, res, next);
});

// Admin auth
router.post("/admin/login", blockIfAuthenticatedAsUser, adminLogin);
router.post("/admin/refresh", refreshAdminToken);

router.post("/admin/logout", (req, res, next) => {
  req.query.type = "admin";
  logout(req, res, next);
});

// Token verification endpoints
router.get("/verify", authenticateUser, (_req, res) => {
  return res.status(200).json({ valid: true });
});

router.get("/admin/verify", authenticateAdmin, (_req, res) => {
  return res.status(200).json({ valid: true });
});

router.get("/profile", authenticateUser, getProfile);
router.put("/profile", authenticateUser, updateProfile);
router.post("/complete-profile", authenticateUser, completeProfile);

export default router;
