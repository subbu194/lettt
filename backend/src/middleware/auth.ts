import { Request, RequestHandler } from "express";
import { AppError } from "./errorHandler";
import { verifyJwt } from "../utils/jwt";
import { User } from "../models/User";

function extractUserToken(req: Request) {
  if (req.cookies && req.cookies.token) return req.cookies.token;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }
  return null;
}

function extractAdminToken(req: Request) {
  if (req.cookies && req.cookies.adminToken) return req.cookies.adminToken;
  const authHeader = req.headers["x-admin-authorization"] as string;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }
  return null;
}

export const authenticateUser: RequestHandler = async (req, _res, next) => {
  const token = extractUserToken(req);
  if (!token) return next(new AppError("Unauthorized - User login required", 401));

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET missing");
    const decoded = verifyJwt(token, secret);

    // Verify tokenVersion against DB to enforce immediate session revocation
    const user = await User.findById(decoded.userId).select("tokenVersion").lean();
    if (!user || user.tokenVersion !== decoded.tokenVersion) {
      return next(new AppError("Session revoked. Please log in again.", 401));
    }

    req.user = decoded;
    return next();
  } catch (err) {
    return next(new AppError("Invalid or expired user session", 401));
  }
};

export const authenticateAdmin: RequestHandler = async (req, _res, next) => {
  const token = extractAdminToken(req);
  if (!token) return next(new AppError("Unauthorized - Admin login required", 401));

  try {
    const secret = process.env.JWT_ADMIN_SECRET;
    if (!secret) throw new Error("JWT_ADMIN_SECRET missing");
    const decoded = verifyJwt(token, secret);
    
    if (decoded.role !== "admin") {
      return next(new AppError("Forbidden - Insufficient permissions", 403));
    }

    // Verify tokenVersion against DB to enforce immediate session revocation
    const user = await User.findById(decoded.userId).select("tokenVersion role").lean();
    if (!user || user.role !== "admin" || user.tokenVersion !== decoded.tokenVersion) {
      return next(new AppError("Admin session revoked. Please log in again.", 401));
    }
    
    req.user = decoded; // The user object acts as Admin now safely
    return next();
  } catch (err) {
    return next(new AppError("Invalid or expired admin session", 401));
  }
};

export const blockIfAuthenticatedAsUser: RequestHandler = (req, _res, next) => {
  const token = extractUserToken(req);
  if (!token) return next();
  
  try {
    const secret = process.env.JWT_SECRET;
    if (secret) {
      const decoded = verifyJwt(token, secret);
      if (decoded.role === "user") return next(new AppError("Forbidden - Logout of user account first", 403));
    }
  } catch {
    // Ignore invalid tokens for this check
  }
  
  return next();
};

