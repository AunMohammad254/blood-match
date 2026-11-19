import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

interface DecodedJwt {
  userId?: string;
  role?: string;
}

// Must match the development fallback in src/lib/config.ts
const DEV_JWT_FALLBACK = "dev_secret_not_for_production_must_be_32_chars_minimum";

// Admin sub-routes backed exclusively by requireAdmin APIs
const ADMIN_ONLY_SUBROUTES = [
  "/admin/users",
  "/admin/donors",
  "/admin/chats",
  "/admin/logs",
] as const;

function matchesRoutePrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * Resolves the Edge JWT verification secret.
 * Fails closed (returns null) in production when JWT_SECRET is missing or empty.
 */
function getJwtSecretBytes(): Uint8Array | null {
  const envSecret = process.env.JWT_SECRET?.trim();
  if (envSecret) {
    return new TextEncoder().encode(envSecret);
  }
  if (process.env.NODE_ENV === "production") {
    return null;
  }
  return new TextEncoder().encode(DEV_JWT_FALLBACK);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const normalizedPath = pathname.replace(/\/+/g, "/").toLowerCase();

  const isDashboardRoute = matchesRoutePrefix(normalizedPath, "/dashboard");
  const isAdminRoute = matchesRoutePrefix(normalizedPath, "/admin");

  // Only guard /dashboard and /admin routes
  if (!isDashboardRoute && !isAdminRoute) {
    return NextResponse.next();
  }

  const tokenCookie = request.cookies.get("bm_token");
  if (!tokenCookie || !tokenCookie.value) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const secret = getJwtSecretBytes();
  if (!secret) {
    // Fail closed in production when JWT_SECRET is unset/empty
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(tokenCookie.value, secret, {
      algorithms: ["HS256"],
    });
    const decoded = payload as unknown as DecodedJwt;

    if (!decoded || typeof decoded.role !== "string" || !decoded.role) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const role = decoded.role;

    // Admin route gating (/admin and /admin/*)
    if (isAdminRoute) {
      // Base gate: matches AdminLayout (only admin and coordinator may enter /admin)
      if (role !== "admin" && role !== "coordinator") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }

      // Strictly admin-only sub-routes (backed by requireAdmin APIs)
      const isAdminOnlySubroute = ADMIN_ONLY_SUBROUTES.some((prefix) =>
        matchesRoutePrefix(normalizedPath, prefix)
      );
      if (isAdminOnlySubroute && role !== "admin") {
        return NextResponse.redirect(new URL("/admin/requests", request.url));
      }

      return NextResponse.next();
    }

    // Role-specific dashboard route gating
    if (
      matchesRoutePrefix(normalizedPath, "/dashboard/verify") &&
      !["hospital_verifier", "admin"].includes(role)
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (
      matchesRoutePrefix(normalizedPath, "/dashboard/coordinator") &&
      !["coordinator", "admin"].includes(role)
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (
      matchesRoutePrefix(normalizedPath, "/dashboard/attendant") &&
      !["patient_attendant", "admin"].includes(role)
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Defense-in-depth block on legacy /dashboard/admin path
    if (matchesRoutePrefix(normalizedPath, "/dashboard/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
