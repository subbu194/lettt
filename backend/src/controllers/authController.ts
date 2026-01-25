import type { RequestHandler } from "express";
import { z } from "zod";
import { User } from "../models/User";
import { AppError } from "../middleware/errorHandler";
import { isStrongPassword } from "../utils/password";
import { validateEmail, sanitizeEmail } from "../utils/emailValidator";

const emailSchema = z.string().email();

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: emailSchema,
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

const updateProfileSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    email: emailSchema.optional(),
    profileImage: z.string().url("profileImage must be a valid URL").optional(),
    password: z.string().min(8, "Password must be at least 8 characters").optional(),
  })
  .strict();

export const signup: RequestHandler = async (req, res, next) => {
  try {
    const { name, email, password } = signupSchema.parse(req.body);
    
    // Validate email and check for typos
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      throw new AppError(emailValidation.error || "Invalid email", 400);
    }
    
    // Use sanitized email
    const sanitizedEmail = sanitizeEmail(email);
    
    if (!isStrongPassword(password)) {
      throw new AppError(
        "Password must include uppercase, lowercase, and number",
        400
      );
    }

    const existing = await User.findOne({ email: sanitizedEmail });
    if (existing) throw new AppError("Email already exists", 400);

    const user = await User.create({ name, email: sanitizedEmail, password, role: "user" });
    const token = user.generateToken(process.env.JWT_SECRET);

    return res.status(201).json({ user: user.toSafeJSON(), token });
  } catch (err) {
    return next(err);
  }
};

export const login: RequestHandler = async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Validate and sanitize email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      throw new AppError(emailValidation.error || "Invalid email", 400);
    }
    const sanitizedEmail = sanitizeEmail(email);

    const user = await User.findOne({ email: sanitizedEmail }).select("+password");
    if (!user) throw new AppError("Invalid credentials", 401);

    const ok = await user.comparePassword(password);
    if (!ok) throw new AppError("Invalid credentials", 401);

    const token = user.generateToken(process.env.JWT_SECRET);
    return res.status(200).json({ user: user.toSafeJSON(), token });
  } catch (err) {
    return next(err);
  }
};

export const adminLogin: RequestHandler = async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) throw new AppError("Invalid credentials", 401);

    const ok = await user.comparePassword(password);
    if (!ok) throw new AppError("Invalid credentials", 401);
    if (user.role !== "admin") throw new AppError("Forbidden", 403);

    const adminSecret = process.env.JWT_ADMIN_SECRET;
    if (!adminSecret) throw new AppError("JWT_ADMIN_SECRET is not configured", 500);

    const token = user.generateToken(adminSecret);
    return res.status(200).json({ user: user.toSafeJSON(), token });
  } catch (err) {
    return next(err);
  }
};

export const logout: RequestHandler = async (_req, res) => {
  // Per requirements: logout is frontend-only by deleting token.
  return res.status(200).json({ message: "Logged out" });
};

export const getProfile: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const user = await User.findById(req.user.userId);
    if (!user) throw new AppError("Not found", 404);
    return res.status(200).json({ user: user.toSafeJSON() });
  } catch (err) {
    return next(err);
  }
};

export const updateProfile: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const update = updateProfileSchema.parse(req.body);

    if (update.password && !isStrongPassword(update.password)) {
      throw new AppError(
        "Password must include uppercase, lowercase, and number",
        400
      );
    }

    const user = await User.findById(req.user.userId).select("+password");
    if (!user) throw new AppError("Not found", 404);

    if (typeof update.name !== "undefined") user.name = update.name;
    if (typeof update.profileImage !== "undefined") user.profileImage = update.profileImage;
    if (typeof update.email !== "undefined") user.email = update.email.toLowerCase();
    if (typeof update.password !== "undefined") user.password = update.password;

    await user.save();
    return res.status(200).json({ user: user.toSafeJSON() });
  } catch (err) {
    return next(err);
  }
};
