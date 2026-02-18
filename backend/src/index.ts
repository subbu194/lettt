import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
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
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

await initializeR2();
// await initializeRazorpay();
await connectDatabase();


app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

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

app.get("/", (_req, res) => {
  res.send("Let The Talent Talk Backend is Running!");
});

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✅ API available at http://localhost:${PORT}`);
});