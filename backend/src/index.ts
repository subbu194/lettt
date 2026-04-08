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
import ticketRoutes from "./routes/ticketRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import exportRoutes from "./routes/exportRoutes";
import talkShowRoutes from "./routes/talkShowRoutes";
import blogRoutes from "./routes/blogRoutes";
import galleryRoutes from "./routes/galleryRoutes";
import searchRoutes from "./routes/searchRoutes";
import ticketBookingRoutes from "./routes/ticketBookingRoutes";
import artOrderRoutes from "./routes/artOrderRoutes";
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
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "unsafe-none" }
  }));

  // CORS: In production, whitelist the frontend origin(s) explicitly.
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim().replace(/\/$/, ""))
    : null;

  app.use(
    cors({
      origin: allowedOrigins
        ? (origin, callback) => {
            const normalizedOrigin = origin ? origin.replace(/\/$/, "") : "";
            
            if (!origin || allowedOrigins.includes(normalizedOrigin)) {
              callback(null, true);
            } else {
              callback(new Error(`CORS: origin ${origin} not allowed`));
            }
          }
        : true,
      credentials: true,
    })
  );

  // Logging
  app.use((req, _res, next) => {
    logger.info(`${req.method} ${req.originalUrl} - IP: ${req.ip}`);
    next();
  });

  // Body parsers
  app.use(express.json({ limit: "1mb" }));
  app.use(mongoSanitize);
  app.use(cookieParser());

  // Rate Limiting
  // Very relaxed for general browsing (no limit in development)
  const defaultLimiter = process.env.NODE_ENV === "production" 
    ? rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 1000, // Much higher for production
        message: { error: "Too many requests, please try again later" },
      })
    : rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 10000, // Effectively unlimited in development
        message: { error: "Too many requests, please try again later" },
      });

  // Strict for auth endpoints (prevent brute force)
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: "Brute-force protection: Too many login attempts" },
  });

  // Moderate for payment endpoints
  const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: { error: "Too many payment attempts, please try again later" },
  });

  // Apply rate limits
  app.use("/api/v1/", defaultLimiter);
  app.use("/api/v1/auth/login", authLimiter);
  app.use("/api/v1/auth/signup", authLimiter);
  app.use("/api/v1/auth/admin/login", authLimiter);
  app.use("/api/v1/art-orders/create", paymentLimiter);
  app.use("/api/v1/art-orders/verify", paymentLimiter);
  app.use("/api/v1/ticket-bookings/create", paymentLimiter);
  app.use("/api/v1/ticket-bookings/verify", paymentLimiter);

  // Health route
  app.use("/api/v1", healthRoutes);

  // Auth routes (email/password for both users and admins)
  app.use("/api/v1/auth", authRoutes);

  // User routes (profile management - requires authentication)
  app.use("/api/v1/user", userRoutes);

  // Resource routes
  app.use("/api/v1/art", artRoutes);
  app.use("/api/v1/events", eventRoutes);
  app.use("/api/v1/tickets", ticketRoutes);
  app.use("/api/v1/upload", uploadRoutes);
  app.use("/api/v1/export", exportRoutes);
  app.use("/api/v1/talkshow", talkShowRoutes);
  app.use("/api/v1/blogs", blogRoutes);
  app.use("/api/v1/gallery", galleryRoutes);
  app.use("/api/v1/search", searchRoutes);
  app.use("/api/v1/ticket-bookings", ticketBookingRoutes);
  app.use("/api/v1/art-orders", artOrderRoutes);

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