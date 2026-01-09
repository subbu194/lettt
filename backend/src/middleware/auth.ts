import type { RequestHandler } from "express";
import { AppError } from "./errorHandler";
import { verifyJwt } from "../utils/jwt";

function extractBearerToken(authHeader?: string) {
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
}

export const authenticateUser: RequestHandler = (req, _res, next) => {
  const token = extractBearerToken(req.headers.authorization);
  if (!token) return next(new AppError("Unauthorized", 401));

  const decoded = verifyJwt(token);
  req.user = decoded;
  return next();
};

export const authenticateAdmin: RequestHandler = (req, res, next) => {
  authenticateUser(req, res, (err) => {
    if (err) return next(err);
    if (!req.user) return next(new AppError("Unauthorized", 401));
    if (req.user.role !== "admin") return next(new AppError("Forbidden", 403));
    return next();
  });
};

export const blockIfAuthenticatedAsUser: RequestHandler = (req, _res, next) => {
  // “Even if they try /admin/login, backend must block them”
  // If a logged-in regular user attempts admin login, block.
  const token = extractBearerToken(req.headers.authorization);
  if (!token) return next();
  try {
    const decoded = verifyJwt(token);
    if (decoded.role === "user") return next(new AppError("Forbidden", 403));
  } catch {
    // ignore invalid tokens for this check; actual login will validate creds
  }
  return next();
};
