import mongoose from "mongoose";

async function connectDatabase() {
    if (!process.env.DB_URL) {
        console.error("DB_URL is not set. Please configure your environment (see backend/env.example)");
        process.exit(1);
    }
    try {
        await mongoose.connect(process.env.DB_URL);
        console.log("✅ Database connected");
    } catch (err) {
        console.error("❌ Database connection failed:", err);
    }
}

export { connectDatabase };