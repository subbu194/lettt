import { Router } from "express";
import {
  createArtOrder,
  verifyArtOrder,
  myArtOrders,
  getArtOrderById,
  adminListArtOrders,
  updateArtOrderStatus,
  getArtOrderStats,
} from "../controllers/artOrderController";
import { authenticateAdmin, authenticateUser } from "../middleware/auth";

const router = Router();

// ─────────────────────────────────────────────────────────────
// User routes
// ─────────────────────────────────────────────────────────────
router.post("/create", authenticateUser, createArtOrder);
router.post("/verify", authenticateUser, verifyArtOrder);
router.get("/my-orders", authenticateUser, myArtOrders);
router.get("/my-orders/:id", authenticateUser, getArtOrderById);

// ─────────────────────────────────────────────────────────────
// Admin routes
// ─────────────────────────────────────────────────────────────
router.get("/admin", authenticateAdmin, adminListArtOrders);
router.get("/admin/stats", authenticateAdmin, getArtOrderStats);
router.patch("/admin/:id/status", authenticateAdmin, updateArtOrderStatus);

export default router;
