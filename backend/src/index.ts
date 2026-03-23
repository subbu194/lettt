import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { logger } from "./utils/logger";
import { connectDatabase } from "./config/database";
import { initializeR2 } from "./config/r2";
import { initializeRazorpay } from "./config/razorpay";
import healthRoutes from "./routes/health";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import artRoutes from "./routes/artRoutes";
import eventRoutes from "./routes/eventRoutes";
import orderRoutes from "./routes/orderRoutes";
import ticketRoutes from "./routes/ticketRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import exportRoutes from "./routes/exportRoutes";
import talkShowRoutes from "./routes/talkShowRoutes";
import blogRoutes from "./routes/blogRoutes";
import galleryRoutes from "./routes/galleryRoutes";
import searchRoutes from "./routes/searchRoutes";
import { razorpayWebhook } from "./controllers/orderController";
import { mongoSanitize } from "./middleware/mongoSanitize";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

async function start() {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    throw new Error("Missing RAZORPAY_WEBHOOK_SECRET");
  }

  await connectDatabase();
  await initializeR2();
  await initializeRazorpay();

  if (process.env.TRUST_PROXY === "true") {
    app.set("trust proxy", 1);
  }

  // Security
  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));

  // Logging
  app.use((req, _res, next) => {
    logger.info(`${req.method} ${req.originalUrl} - IP: ${req.ip}`);
    next();
  });

  // Body parsers
  app.post("/api/v1/orders/webhook", express.raw({ type: "application/json" }), razorpayWebhook);
  app.use(express.json({ limit: "1mb" }));
  app.use(mongoSanitize);
  app.use(cookieParser());

  // Rate Limiting
  const defaultLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: "Too many requests, please try again later" },
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: "Brute-force protection: Too many login attempts" },
  });

  app.use("/api/v1/", defaultLimiter);
  app.use("/api/v1/auth/login", authLimiter);
  app.use("/api/v1/auth/signup", authLimiter);
  app.use("/api/v1/auth/admin/login", authLimiter);

  // Health route
  app.use("/api/v1", healthRoutes);

  // Auth routes (standardized under /api/v1/auth)
  app.use("/api/v1/auth", authRoutes);

  // User routes (profile management)
  app.use("/api/v1/user", userRoutes);

  // Resource routes
  app.use("/api/v1/art", artRoutes);
  app.use("/api/v1/events", eventRoutes);
  app.use("/api/v1/orders", orderRoutes);
  app.use("/api/v1/tickets", ticketRoutes);
  app.use("/api/v1/upload", uploadRoutes);
  app.use("/api/v1/export", exportRoutes);
  app.use("/api/v1/talkshow", talkShowRoutes);
  app.use("/api/v1/blogs", blogRoutes);
  app.use("/api/v1/gallery", galleryRoutes);
  app.use("/api/v1/search", searchRoutes);

  app.get("/", (_req, res) => {
    res.send("Let The Talent Talk Backend is Running!");
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  app.listen(PORT, () => {
    console.log(`✅ API available at http://localhost:${PORT}`);
  });
}
start();