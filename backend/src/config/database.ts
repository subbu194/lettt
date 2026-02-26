import mongoose from "mongoose";

async function connectDatabase() {
    if (!process.env.DB_URL) {
        console.error("\x1b[31m❌ Database Configuration Error: DB_URL is not set\x1b[0m");
        console.error("\x1b[31m   Please configure your environment (see backend/env.example)\x1b[0m");
        process.exit(1);
    }
    try {
        await mongoose.connect(process.env.DB_URL);
        console.log("\u2705 Database connected");
    } catch (err) {
        console.error("\x1b[31m\u274c Database connection failed:\x1b[0m", err);
        process.exit(1);
    }
}

export { connectDatabase };