import type { ErrorRequestHandler, RequestHandler } from "express";

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError(`Not found: ${req.method} ${req.originalUrl}`, 404));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const statusCode =
    err instanceof AppError ? err.statusCode : typeof err?.statusCode === "number" ? err.statusCode : 500;

  // Normalize common auth/db errors
  const name = err?.name;
  if (name === "JsonWebTokenError" || name === "TokenExpiredError") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (err?.code === 11000) {
    return res.status(400).json({ error: "Email already exists" });
  }

  if (name === "ZodError") {
    const message = err?.issues?.[0]?.message ?? "Invalid input";
    return res.status(400).json({ error: message });
  }

  if (name === "CastError") {
    return res.status(400).json({ error: "Invalid identifier in request" });
  }

  if (statusCode >= 500) {
    const isOperational = err instanceof AppError && err.isOperational;
    if (isOperational) {
      return res.status(statusCode).json({ error: err.message || "Request failed" });
    }

    console.error("Unhandled error:", err);

    // Never leak internals in production for unhandled exceptions.
    const message = process.env.NODE_ENV === "development" ? (err?.message ?? "Server error") : "Server error";
    return res.status(500).json({ error: message });
  }

  return res.status(statusCode).json({ error: err?.message ?? "Request failed" });
};
