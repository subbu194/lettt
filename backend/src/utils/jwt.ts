import jwt from "jsonwebtoken";
import type { JwtPayload } from "../types";

export function signJwt(payload: JwtPayload, secret: string) {
  // Tokens must NOT expire: do not set expiresIn.
  return jwt.sign(payload, secret);
}

export function verifyJwt(token: string): JwtPayload {
  const userSecret = process.env.JWT_SECRET;
  const adminSecret = process.env.JWT_ADMIN_SECRET;

  if (!userSecret && !adminSecret) {
    throw new Error("JWT secrets are not configured");
  }

  const tryVerify = (secret?: string) => {
    if (!secret) return null;
    try {
      const decoded = jwt.verify(token, secret);
      return decoded as JwtPayload;
    } catch {
      return null;
    }
  };

  const decoded = tryVerify(userSecret) ?? tryVerify(adminSecret);
  if (!decoded) {
    const err = new Error("Invalid token");
    // Tag for error handler
    (err as any).name = "JsonWebTokenError";
    throw err;
  }

  return decoded;
}
