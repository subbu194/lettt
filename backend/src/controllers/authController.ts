import type { Request, Response, NextFunction, RequestHandler } from "express";
import { z } from "zod";
import { User, UserDocument } from "../models/User";
import { AppError } from "../middleware/errorHandler";
import { isStrongPassword } from "../utils/password";
import { validateEmail, sanitizeEmail } from "../utils/emailValidator";
import { signAccessToken, signRefreshToken, verifyJwt } from "../utils/jwt";
import { setAuthCookies, clearAuthCookies } from "../utils/cookie";

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
    name: z.string().min(2).optional(),
    email: emailSchema.optional(),
    profileImage: z.string().url().optional(),
    password: z.string().min(8).optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    pincode: z.string().optional(),
  }).strict();

const createTokens = (user: UserDocument, isAdmin: boolean) => {
  const payload = { userId: user._id.toString(), email: user.email, role: user.role, tokenVersion: user.tokenVersion };
  return {
    accessToken: signAccessToken(payload, isAdmin),
    refreshToken: signRefreshToken(payload, isAdmin),
  };
};

export const signup: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = signupSchema.parse(req.body);
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) throw new AppError(emailValidation.error || "Invalid email", 400);
    const sanitizedEmail = sanitizeEmail(email);

    if (!isStrongPassword(password)) {
      throw new AppError("Password must include uppercase, lowercase, and number", 400);
    }

    const existing = await User.findOne({ email: sanitizedEmail });
    if (existing) throw new AppError("Email already exists", 400);

    const user = await User.create({ name, email: sanitizedEmail, password, role: "user" });
    const { accessToken, refreshToken } = createTokens(user, false);
    
    setAuthCookies(res, accessToken, refreshToken, false);
    return res.status(201).json({ user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
};

export const login: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) throw new AppError(emailValidation.error || "Invalid email", 400);
    const sanitizedEmail = sanitizeEmail(email);

    const user = await User.findOne({ email: sanitizedEmail, role: "user" }).select("+password");
    if (!user) throw new AppError("Invalid credentials", 401);

    const ok = await user.comparePassword(password);
    if (!ok) throw new AppError("Invalid credentials", 401);

    const { accessToken, refreshToken } = createTokens(user, false);
    setAuthCookies(res, accessToken, refreshToken, false);

    return res.status(200).json({ user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
};

export const adminLogin: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const sanitizedEmail = sanitizeEmail(email);

    const user = await User.findOne({ email: sanitizedEmail, role: "admin" }).select("+password");
    if (!user) throw new AppError("Invalid admin credentials", 401);

    const ok = await user.comparePassword(password);
    if (!ok) throw new AppError("Invalid admin credentials", 401);

    const { accessToken, refreshToken } = createTokens(user, true);
    setAuthCookies(res, accessToken, refreshToken, true);

    return res.status(200).json({ user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
};

export const logout: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Determine context string from route or query to clear right cookies correctly
    const type = req.query.type as string; 
    if (type === 'admin') {
      clearAuthCookies(res, true);
    } else {
      clearAuthCookies(res, false);
    }
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
};

export const refreshUserToken: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) throw new AppError("Refresh token missing", 401);

    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) throw new Error("JWT_REFRESH_SECRET missing");

    const decoded = verifyJwt(token, secret);
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== "user" || user.tokenVersion !== decoded.tokenVersion) {
      clearAuthCookies(res, false);
      throw new AppError("Session expired or invalid", 401);
    }

    const { accessToken, refreshToken } = createTokens(user, false);
    setAuthCookies(res, accessToken, refreshToken, false);

    return res.status(200).json({ ok: true });
  } catch (error) {
    clearAuthCookies(res, false);
    return res.status(401).json({ message: "Unauthorized refresh" });
  }
};

export const refreshAdminToken: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.adminRefreshToken;
    if (!token) throw new AppError("Admin refresh token missing", 401);

    const secret = process.env.JWT_ADMIN_REFRESH_SECRET;
    if (!secret) throw new Error("JWT_ADMIN_REFRESH_SECRET missing");

    const decoded = verifyJwt(token, secret);
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== "admin" || user.tokenVersion !== decoded.tokenVersion) {
      clearAuthCookies(res, true);
      throw new AppError("Admin session expired or invalid", 401);
    }

    const { accessToken, refreshToken } = createTokens(user, true);
    setAuthCookies(res, accessToken, refreshToken, true);

    return res.status(200).json({ ok: true });
  } catch (error) {
    clearAuthCookies(res, true);
    return res.status(401).json({ message: "Unauthorized admin refresh" });
  }
};

export const getProfile: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const user = await User.findById(req.user.userId);
    if (!user) throw new AppError("Not found", 404);
    return res.status(200).json({ user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
};

export const updateProfile: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const update = updateProfileSchema.parse(req.body);
    const user = await User.findById(req.user.userId).select("+password");
    if (!user) throw new AppError("Not found", 404);

    if (update.password) {
      if (!isStrongPassword(update.password)) throw new AppError("Password too weak", 400);
      user.password = update.password;
      user.tokenVersion += 1; // Revoke old sessions
    }

    if (update.name !== undefined) user.name = update.name;
    if (update.profileImage !== undefined) user.profileImage = update.profileImage;
    if (update.email !== undefined) user.email = sanitizeEmail(update.email);
    if (update.phone !== undefined) user.phone = update.phone;
    if (update.address !== undefined) user.address = update.address;
    if (update.city !== undefined) user.city = update.city;
    if (update.pincode !== undefined) user.pincode = update.pincode;

    await user.save();
    return res.status(200).json({ user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
};

export const completeProfile: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const user = await User.findById(req.user.userId);
    if (!user) throw new AppError("Not found", 404);
    
    // Quick validation
    if (!req.body.phone) throw new AppError("Phone missing", 400);

    user.phone = req.body.phone;
    user.address = req.body.address;
    user.city = req.body.city;
    user.pincode = req.body.pincode;
    user.isProfileComplete = true;

    await user.save();
    return res.status(200).json({ user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
};
