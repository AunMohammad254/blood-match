import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

interface DecodedJwt {
  userId?: string;
  role?: string;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only guard /dashboard routes
  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  const tokenCookie = request.cookies.get("bm_token");
  if (!tokenCookie || !tokenCookie.value) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback_secret_for_dev_only");
    const { payload } = await jwtVerify(tokenCookie.value, secret);
    const decoded = payload as unknown as DecodedJwt;

    if (!decoded || !decoded.role) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const role = decoded.role;

    // Role-specific dashboard route gating
    if (pathname.startsWith("/dashboard/verify") && !["hospital_verifier", "admin"].includes(role)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (pathname.startsWith("/dashboard/coordinator") && !["coordinator", "admin"].includes(role)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (pathname.startsWith("/dashboard/attendant") && !["patient_attendant", "admin"].includes(role)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (pathname.startsWith("/dashboard/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
