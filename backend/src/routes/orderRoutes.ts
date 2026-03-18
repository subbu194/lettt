import { Router } from "express";
import { 
  createOrder, 
  verifyOrder, 
  reconcileOrder,
  myOrders, 
  getOrderById,
  adminListOrders,
  getOrderStats,
  exportOrdersCSV,
} from "../controllers/orderController";
import { authenticateAdmin, authenticateUser } from "../middleware/auth";

const router = Router();

// ─────────────────────────────────────────────────────────────
// User routes
// ─────────────────────────────────────────────────────────────
router.post("/create", authenticateUser, createOrder);
router.post("/verify", authenticateUser, verifyOrder);
router.post("/reconcile", authenticateUser, reconcileOrder);
router.get("/my-orders", authenticateUser, myOrders);
router.get("/my-orders/:id", authenticateUser, getOrderById);

// ─────────────────────────────────────────────────────────────
// Admin routes
// ─────────────────────────────────────────────────────────────
router.get("/admin", authenticateAdmin, adminListOrders);
router.get("/admin/stats", authenticateAdmin, getOrderStats);
router.get("/admin/export-csv", authenticateAdmin, exportOrdersCSV);

export default router;
