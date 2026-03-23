import { Response } from "express";

export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string,
  isAdmin: boolean = false
) => {
  const isProd = process.env.NODE_ENV === "production";
  const accessKey = isAdmin ? "adminToken" : "token";
  const refreshKey = isAdmin ? "adminRefreshToken" : "refreshToken";

  // Access Token: Short Lived (15 minutes)
  res.cookie(accessKey, accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "strict" : "lax",
    path: "/",
    maxAge: 15 * 60 * 1000, 
  });

  // Refresh Token: Long Lived (7 Days)
  res.cookie(refreshKey, refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "strict" : "lax",
    path: isAdmin ? "/api/v1/auth/admin/refresh" : "/api/v1/auth/refresh",
    maxAge: 7 * 24 * 60 * 60 * 1000, 
  });
};

export const clearAuthCookies = (res: Response, isAdmin: boolean = false) => {
  const isProd = process.env.NODE_ENV === "production";
  const accessKey = isAdmin ? "adminToken" : "token";
  const refreshKey = isAdmin ? "adminRefreshToken" : "refreshToken";
  const refreshPath = isAdmin ? "/api/v1/auth/admin/refresh" : "/api/v1/auth/refresh";

  res.clearCookie(accessKey, { httpOnly: true, secure: isProd, sameSite: isProd ? "strict" : "lax", path: "/" });
  res.clearCookie(refreshKey, { httpOnly: true, secure: isProd, sameSite: isProd ? "strict" : "lax", path: refreshPath });
};
