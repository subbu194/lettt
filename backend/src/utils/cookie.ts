import { Response } from "express";

/**
 * Cookie configuration for cross-origin deployment.
 * 
 * Frontend (e.g. wtbiindia.in) and Backend (api.wtbiindia.in) are on different
 * subdomains. For cookies to be sent cross-origin:
 * - sameSite must be "none" (not "strict" or "lax")
 * - secure must be true
 * - domain should be set to the parent domain so cookies are shared
 */

function getCookieDomain(): string | undefined {
  // If COOKIE_DOMAIN is explicitly set, use it (e.g. ".wtbiindia.in")
  if (process.env.COOKIE_DOMAIN) return process.env.COOKIE_DOMAIN;
  // In production, default to undefined (cookie stays on the API domain)
  // This works with sameSite: "none" for cross-origin
  return undefined;
}

function getCookieOptions(isProd: boolean) {
  return {
    httpOnly: true,
    secure: isProd, // must be true for sameSite: "none"
    sameSite: isProd ? ("none" as const) : ("lax" as const),
    domain: isProd ? getCookieDomain() : undefined,
  };
}

export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string,
  isAdmin: boolean = false
) => {
  const isProd = process.env.NODE_ENV === "production";
  const accessKey = isAdmin ? "adminToken" : "token";
  const refreshKey = isAdmin ? "adminRefreshToken" : "refreshToken";
  const base = getCookieOptions(isProd);

  // Access Token: Short Lived (15 minutes)
  res.cookie(accessKey, accessToken, {
    ...base,
    path: "/",
    maxAge: 15 * 60 * 1000, 
  });

  // Refresh Token: Long Lived (7 Days)
  // Using path: "/" so the refresh token is sent on all requests.
  // The endpoint itself is still protected by route-level middleware.
  res.cookie(refreshKey, refreshToken, {
    ...base,
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, 
  });
};

export const clearAuthCookies = (res: Response, isAdmin: boolean = false) => {
  const isProd = process.env.NODE_ENV === "production";
  const accessKey = isAdmin ? "adminToken" : "token";
  const refreshKey = isAdmin ? "adminRefreshToken" : "refreshToken";
  const base = getCookieOptions(isProd);

  res.clearCookie(accessKey, { ...base, path: "/" });
  res.clearCookie(refreshKey, { ...base, path: "/" });
};
