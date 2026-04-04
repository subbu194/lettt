import jwt from "jsonwebtoken";
import type { JwtPayload } from "../types";
import type { SignOptions } from "jsonwebtoken";

export function signJwt(
  payload: JwtPayload,
  secret: string,
  expiresIn: SignOptions["expiresIn"]
) {
  return jwt.sign(payload, secret, { expiresIn });
}

export function signAccessToken(payload: JwtPayload, isAdmin: boolean = false): string {
  const secret = isAdmin ? process.env.JWT_ADMIN_SECRET : process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT secret not configured");
  return signJwt(payload, secret, "15m");
}

export function signRefreshToken(payload: JwtPayload, isAdmin: boolean = false): string {
  const secret = isAdmin ? process.env.JWT_ADMIN_REFRESH_SECRET : process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error("JWT refresh secret not configured");
  return signJwt(payload, secret, "30d");
}

export function verifyJwt(token: string, secret: string): JwtPayload {
  try {
    return jwt.verify(token, secret) as JwtPayload;
  } catch (error) {
    const err = new Error("Invalid or expired token");
    (err as any).name = "JsonWebTokenError";
    throw err;
  }
}
