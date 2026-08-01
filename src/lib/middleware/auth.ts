import jwt from "jsonwebtoken";
import { config } from "@/lib/config";
import { Role } from "@/lib/constants";

export interface DecodedToken {
  userId: string;
  role: Role;
  bloodType: string;
}

/**
 * Parse the `bm_token` value out of the raw `Cookie` request header.
 * This works with a plain `Request` object and is safe during SSG/prerendering.
 */
function getCookieToken(req: Request): string | null {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const [rawKey, ...valueParts] = trimmed.split("=");
    if (rawKey.trim() === "bm_token") {
      return decodeURIComponent(valueParts.join("=").trim());
    }
  }
  return null;
}

export function verifyAuth(req: Request): DecodedToken | null {
  let token: string | null = null;

  // Primary: read from httpOnly cookie (set by /api/auth/login)
  token = getCookieToken(req);

  // Fallback: Bearer header (kept for SSE EventSource compatibility on some proxies)
  if (!token) {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.replace("Bearer ", "");
    }
  }

  if (!token) return null;

  try {
    return jwt.verify(token, config.jwtSecret) as DecodedToken;
  } catch {
    return null;
  }
}

/** Requires the caller to be an admin only. Coordinators are NOT included. */
export function requireAdmin(req: Request): DecodedToken | null {
  const decoded = verifyAuth(req);
  if (!decoded || decoded.role !== "admin") return null;
  return decoded;
}

/** Requires the caller to be a coordinator (and only a coordinator). */
export function requireCoordinator(req: Request): DecodedToken | null {
  const decoded = verifyAuth(req);
  if (!decoded || decoded.role !== "coordinator") return null;
  return decoded;
}

/** Requires the caller to be either an admin or a coordinator. */
export function requirePrivileged(req: Request): DecodedToken | null {
  const decoded = verifyAuth(req);
  if (!decoded || (decoded.role !== "admin" && decoded.role !== "coordinator")) return null;
  return decoded;
}
