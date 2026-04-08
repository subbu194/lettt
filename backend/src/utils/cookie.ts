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
    // CHIPS (Cookies Having Independent Partitioned State)
    // This allows the cookie to be stored even if third-party cookies are blocked,
    // because it partitions the cookie to the site the user is visiting.
    partitioned: isProd, 
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

  // First, clear any stale cookies from the OLD configuration
  // (old refresh tokens had restricted paths and sameSite: "strict")
  clearLegacyCookies(res, isProd, isAdmin);

  // Access Token: cookie lives 30 days (JWT inside expires in 15m, frontend auto-refreshes)
  res.cookie(accessKey, accessToken, {
    ...base,
    path: "/",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  // Refresh Token: 30 days (rolling — re-issued on every refresh call)
  // Users stay logged in until they manually logout.
  res.cookie(refreshKey, refreshToken, {
    ...base,
    path: "/",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};

/**
 * Clear old cookies that were set with the previous configuration.
 * Old refresh tokens used restricted paths like /api/v1/auth/refresh
 * and sameSite: "strict". We need to clear those on the old paths
 * and with the old sameSite value, otherwise the browser keeps them.
 */
function clearLegacyCookies(res: Response, isProd: boolean, isAdmin: boolean) {
  const refreshKey = isAdmin ? "adminRefreshToken" : "refreshToken";
  const oldPath = isAdmin ? "/api/v1/auth/admin/refresh" : "/api/v1/auth/refresh";

  // Clear with old sameSite: "strict" + old path
  res.clearCookie(refreshKey, { httpOnly: true, secure: isProd, sameSite: "strict", path: oldPath });
  // Also try with "lax" in case it was set in dev
  res.clearCookie(refreshKey, { httpOnly: true, secure: isProd, sameSite: "lax", path: oldPath });
}

export const clearAuthCookies = (res: Response, isAdmin: boolean = false) => {
  const isProd = process.env.NODE_ENV === "production";
  const base = getCookieOptions(isProd);

  // Helper to clear cookie with multiple attribute combinations
  const clearCookieCombinations = (key: string) => {
    // Current configuration
    res.cookie(key, "", { ...base, path: "/", maxAge: 0, expires: new Date(0) });
    
    // Try without partitioned flag
    if (isProd) {
      res.cookie(key, "", { 
        httpOnly: true, 
        secure: true, 
        sameSite: "none", 
        domain: getCookieDomain(), 
        path: "/", 
        maxAge: 0, 
        expires: new Date(0) 
      });
      
      // Try with domain undefined
      res.cookie(key, "", { 
        httpOnly: true, 
        secure: true, 
        sameSite: "none", 
        path: "/", 
        maxAge: 0, 
        expires: new Date(0) 
      });
    }
    
    // Development configuration
    res.cookie(key, "", { 
      httpOnly: true, 
      secure: false, 
      sameSite: "lax", 
      path: "/", 
      maxAge: 0, 
      expires: new Date(0) 
    });
    
    // Legacy configurations
    res.clearCookie(key, { httpOnly: true, secure: isProd, sameSite: "strict", path: "/" });
    res.clearCookie(key, { httpOnly: true, secure: isProd, sameSite: "lax", path: "/" });
  };

  // ALWAYS clear ALL auth cookies to prevent orphaned sessions
  // User cookies
  clearCookieCombinations("token");
  clearCookieCombinations("refreshToken");
  
  // Admin cookies
  clearCookieCombinations("adminToken");
  clearCookieCombinations("adminRefreshToken");

  // Clear old path-restricted refresh cookies for both user and admin
  clearLegacyCookies(res, isProd, false); // user
  clearLegacyCookies(res, isProd, true);  // admin
};

