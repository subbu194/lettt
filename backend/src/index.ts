import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import { connectDatabase } from "./config/database";
import apiRoutes from "./routes/health";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

connectDatabase();

// Trust proxy - required for express-rate-limit behind proxy (GCP VM, Cloudflare, Nginx)
app.set('trust proxy', 1);

app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes - all endpoints under /api/v1
app.use("/api/v1", apiRoutes);

app.get("/", (req, res) => {
  res.send("Let The Talent Talk Backend is Running!");
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 API available at http://localhost:${PORT}/api/v1`);
});