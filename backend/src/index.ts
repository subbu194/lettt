import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import { connectDatabase } from "./config/database";
import healthRoutes from "./routes/health";
import authRoutes from "./routes/authRoutes";
import artRoutes from "./routes/artRoutes";
import eventRoutes from "./routes/eventRoutes";
import orderRoutes from "./routes/orderRoutes";
import ticketRoutes from "./routes/ticketRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

await connectDatabase();

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Existing health route under /api/v1
app.use("/api/v1", healthRoutes);

// Auth routes: satisfy spec (/api/auth/*) AND keep existing frontend compatibility (/api/v1/auth/*)
app.use("/api/auth", authRoutes);
app.use("/api/v1/auth", authRoutes);

// Phase 1 routes
app.use("/api/v1/art", artRoutes);
app.use("/api/v1/events", eventRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/tickets", ticketRoutes);
app.use("/api/v1/upload", uploadRoutes);

app.get("/", (_req, res) => {
  res.send("Let The Talent Talk Backend is Running!");
});

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 API available at http://localhost:${PORT}`);
});