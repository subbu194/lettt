import { Router } from "express";
import { 
  exportOrders,
  exportTickets,
  exportArt,
  exportEvents,
  exportUsers,
} from "../controllers/exportController";
import { authenticateAdmin } from "../middleware/auth";

const router = Router();

// All export routes require admin authentication
router.get("/orders", authenticateAdmin, exportOrders);
router.get("/tickets", authenticateAdmin, exportTickets);
router.get("/art", authenticateAdmin, exportArt);
router.get("/events", authenticateAdmin, exportEvents);
router.get("/users", authenticateAdmin, exportUsers);

export default router;
