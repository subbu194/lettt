import { Request, RequestHandler } from "express";
import { AppError } from "./errorHandler";
import { verifyJwt } from "../utils/jwt";

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

export const authenticateUser: RequestHandler = (req, _res, next) => {
  const token = extractUserToken(req);
  if (!token) return next(new AppError("Unauthorized - User login required", 401));

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET missing");
    req.user = verifyJwt(token, secret);
    return next();
  } catch (err) {
    return next(new AppError("Invalid or expired user session", 401));
  }
};

export const authenticateAdmin: RequestHandler = (req, _res, next) => {
  const token = extractAdminToken(req);
  if (!token) return next(new AppError("Unauthorized - Admin login required", 401));

  try {
    const secret = process.env.JWT_ADMIN_SECRET;
    if (!secret) throw new Error("JWT_ADMIN_SECRET missing");
    const decoded = verifyJwt(token, secret);
    
    if (decoded.role !== "admin") {
      return next(new AppError("Forbidden - Insufficient permissions", 403));
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
