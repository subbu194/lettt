import type { RequestHandler } from "express";
import { User } from "../models/User";
import { AppError } from "./errorHandler";

/**
 * Middleware to block access until the user's profile is complete.
 *
 * Profile completion requires: email, phone, and address.
 */
export const requireProfileComplete: RequestHandler = async (req, _res, next) => {
  try {
    if (!req.user) return next(new AppError("Unauthorized", 401));

    const user = await User.findById(req.user.userId);
    if (!user) return next(new AppError("User not found", 404));

    // Admins are exempt from profile completion
    if (user.role === "admin") return next();

    if (!user.isProfileComplete) {
      const missing: string[] = [];

      if (!user.phone) missing.push("phone");
      if (!user.address) missing.push("address");

      return next(
        new AppError(
          `Profile incomplete. Missing: ${missing.join(", ")}. Please complete your profile.`,
          403
        )
      );
    }

    return next();
  } catch (err) {
    return next(err);
  }
};
