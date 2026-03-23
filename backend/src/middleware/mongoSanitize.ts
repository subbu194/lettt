import { Request, Response, NextFunction } from "express";

/**
 * Recursively sanitize an object by removing keys that start with '$'
 * to prevent MongoDB operator injection attacks.
 */
function sanitize(v: any): any {
  if (Array.isArray(v)) {
    return v.map(sanitize);
  }
  if (v !== null && typeof v === "object") {
    const result: Record<string, any> = {};
    for (const key in v) {
      if (Object.prototype.hasOwnProperty.call(v, key) && !/^\$/.test(key)) {
        result[key] = sanitize(v[key]);
      }
    }
    return result;
  }
  return v;
}

/**
 * Middleware to sanitize request body against MongoDB injection.
 * 
 * Note: We only sanitize req.body because:
 * - req.query is readonly in Express and validated by Zod schemas
 * - req.params are route parameters (strings only, validated by controllers)
 * - req.body is where user-submitted JSON/form data comes in
 */
export const mongoSanitize = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitize(req.body);
  }
  next();
};
