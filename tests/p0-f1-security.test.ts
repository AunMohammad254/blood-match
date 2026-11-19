import { describe, test, expect, afterEach } from "bun:test";
import { NextRequest } from "next/server";
import { SignJWT } from "jose";
import { readFileSync } from "fs";
import { join } from "path";

import {
  RegisterSchema,
  AdminUpdateUserSchema,
  PUBLIC_REGISTRATION_ROLES,
} from "../src/lib/validation/schemas/auth.schema";
import { POST as registerPost } from "../src/app/api/auth/register/route";
import { PATCH as adminUpdateUserPatch } from "../src/app/api/admin/users/[id]/route";
import { middleware, config as middlewareConfig } from "../src/middleware";
import { findEligibleDonors } from "../src/lib/matching-engine";
import {
  SAFE_DONOR_PROJECTION,
  SAFE_DONOR_DIRECTORY_PROJECTION,
  sanitizeDonorForMatch,
  sanitizeMatchResults,
  sanitizeDonorForDirectory,
} from "../src/lib/privacy";

const DEV_FALLBACK_SECRET =
  "dev_secret_not_for_production_must_be_32_chars_minimum";
const OLD_INSECURE_FALLBACK = "fallback_secret_for_dev_only";

async function signTestJwt(
  payload: Record<string, unknown>,
  secret: string,
  expiresIn = "1h"
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(new TextEncoder().encode(secret));
}

function makeRequest(pathname: string, token?: string): NextRequest {
  const url = `http://localhost:3000${pathname}`;
  const headers = new Headers();
  if (token !== undefined) {
    headers.set("cookie", `bm_token=${encodeURIComponent(token)}`);
  }
  return new NextRequest(url, { headers });
}

function isNextPassThrough(res: Response): boolean {
  // NextResponse.next() sets x-middleware-next: 1 and has status 200
  return res.status === 200 && res.headers.get("x-middleware-next") === "1";
}

function getRedirectPathname(res: Response): string | null {
  const loc = res.headers.get("location");
  if (!loc) return null;
  return new URL(loc).pathname;
}

describe("P0-F1: Public Registration RBAC (RegisterSchema & /api/auth/register)", () => {
  const basePayload = {
    name: "Test User",
    email: "user@example.com",
    password: "Password1",
    phone: "03001234567",
    bloodType: "O+",
    city: "Karachi",
  };

  test("PUBLIC_REGISTRATION_ROLES only includes donor, recipient, and patient_attendant", () => {
    expect([...PUBLIC_REGISTRATION_ROLES].sort()).toEqual([
      "donor",
      "patient_attendant",
      "recipient",
    ]);
  });

  test.each(["donor", "patient_attendant", "recipient"])(
    "RegisterSchema accepts public role '%s'",
    (role) => {
      const res = RegisterSchema.safeParse({ ...basePayload, role });
      expect(res.success).toBe(true);
    }
  );

  test.each(["hospital_verifier", "admin", "coordinator", "superuser"])(
    "RegisterSchema rejects privileged/unknown role '%s'",
    (role) => {
      const res = RegisterSchema.safeParse({ ...basePayload, role });
      expect(res.success).toBe(false);
    }
  );

  test.each(["hospital_verifier", "admin", "coordinator"])(
    "POST /api/auth/register returns 403 when attempting to self-register as '%s'",
    async (role) => {
      const req = new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": `10.0.0.${role.length}`,
        },
        body: JSON.stringify({ ...basePayload, role }),
      });

      const res = await registerPost(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("forbidden");
    }
  );

  test.each([
    "donor",
    "recipient",
    "patient_attendant",
    "hospital_verifier",
    "coordinator",
    "admin",
  ])("AdminUpdateUserSchema allows admin to assign role '%s'", (role) => {
    const res = AdminUpdateUserSchema.safeParse({ role });
    expect(res.success).toBe(true);
  });

  test("AdminUpdateUserSchema rejects invalid roles", () => {
    const res = AdminUpdateUserSchema.safeParse({ role: "root_god_mode" });
    expect(res.success).toBe(false);
  });

  test("PATCH /api/admin/users/[id] rejects unauthenticated callers with 403 before touching DB", async () => {
    const req = new Request("http://localhost:3000/api/admin/users/usr_1", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role: "hospital_verifier" }),
    });
    const res = await adminUpdateUserPatch(req, { params: { id: "usr_1" } });
    expect(res.status).toBe(403);
  });
});

describe("P0-F1: Edge Middleware Admin & JWT Secret Hardening", () => {
  const originalEnv = {
    NODE_ENV: process.env.NODE_ENV,
    JWT_SECRET: process.env.JWT_SECRET,
  };

  afterEach(() => {
    (process.env as Record<string, string | undefined>).NODE_ENV =
      originalEnv.NODE_ENV;
    if (originalEnv.JWT_SECRET === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalEnv.JWT_SECRET;
    }
  });

  test("config.matcher guards both /dashboard/:path* and /admin/:path*", () => {
    expect(middlewareConfig.matcher).toContain("/dashboard/:path*");
    expect(middlewareConfig.matcher).toContain("/admin/:path*");
  });

  test("allows unprotected public routes without a token", async () => {
    const res = await middleware(makeRequest("/login"));
    expect(isNextPassThrough(res)).toBe(true);
  });

  test("rejects unauthenticated requests to /admin and /admin/users with redirect to /login", async () => {
    const resAdmin = await middleware(makeRequest("/admin"));
    expect(resAdmin.status).toBe(307);
    expect(getRedirectPathname(resAdmin)).toBe("/login");
    expect(new URL(resAdmin.headers.get("location")!).searchParams.get("redirect")).toBe("/admin");

    const resUsers = await middleware(makeRequest("/admin/users"));
    expect(resUsers.status).toBe(307);
    expect(getRedirectPathname(resUsers)).toBe("/login");
    expect(new URL(resUsers.headers.get("location")!).searchParams.get("redirect")).toBe("/admin/users");
  });

  test.each(["donor", "patient_attendant", "recipient", "hospital_verifier"])(
    "rejects non-privileged role '%s' JWT on /admin and /admin/users -> redirects to /dashboard",
    async (role) => {
      process.env.JWT_SECRET = "test-strong-secret-for-unit-tests-123456";
      const token = await signTestJwt(
        { userId: "u1", role },
        process.env.JWT_SECRET
      );

      const resAdmin = await middleware(makeRequest("/admin", token));
      expect(resAdmin.status).toBe(307);
      expect(getRedirectPathname(resAdmin)).toBe("/dashboard");

      const resUsers = await middleware(makeRequest("/admin/users", token));
      expect(resUsers.status).toBe(307);
      expect(getRedirectPathname(resUsers)).toBe("/dashboard");
    }
  );

  test("allows valid signed admin JWT on /admin, /admin/users, /admin/logs, /admin/chats, /admin/donors, /admin/requests, and /dashboard/admin", async () => {
    process.env.JWT_SECRET = "test-strong-secret-for-unit-tests-123456";
    const token = await signTestJwt(
      { userId: "admin1", role: "admin" },
      process.env.JWT_SECRET
    );

    const adminPaths = [
      "/admin",
      "/admin/users",
      "/admin/donors",
      "/admin/chats",
      "/admin/logs",
      "/admin/requests",
      "/dashboard/admin",
    ];

    for (const path of adminPaths) {
      const res = await middleware(makeRequest(path, token));
      expect(isNextPassThrough(res)).toBe(true);
    }
  });

  test("enforces coordinator boundaries on /admin/* and /dashboard/admin", async () => {
    process.env.JWT_SECRET = "test-strong-secret-for-unit-tests-123456";
    const token = await signTestJwt(
      { userId: "coord1", role: "coordinator" },
      process.env.JWT_SECRET
    );

    // Allowed coordinator paths
    expect(isNextPassThrough(await middleware(makeRequest("/admin", token)))).toBe(true);
    expect(isNextPassThrough(await middleware(makeRequest("/admin/requests", token)))).toBe(true);
    expect(isNextPassThrough(await middleware(makeRequest("/dashboard/coordinator", token)))).toBe(true);

    // Strictly admin-only sub-routes must reject coordinator (including double-slash & case-variation bypass attempts)
    for (const blockedPath of [
      "/admin/users",
      "/admin/users/123",
      "/admin//users",
      "/Admin/Users",
      "/admin/donors",
      "/admin/chats",
      "/admin/logs",
    ]) {
      const res = await middleware(makeRequest(blockedPath, token));
      expect(res.status).toBe(307);
      expect(getRedirectPathname(res)).toBe("/admin/requests");
    }

    // Legacy /dashboard/admin must remain admin-only
    const resDashAdmin = await middleware(makeRequest("/dashboard/admin", token));
    expect(resDashAdmin.status).toBe(307);
    expect(getRedirectPathname(resDashAdmin)).toBe("/dashboard");
  });

  test("does not false-match non-admin paths sharing prefix like /administrator", async () => {
    const res = await middleware(makeRequest("/administrator"));
    expect(isNextPassThrough(res)).toBe(true);
  });

  test("rejects forged, unsigned (alg:none), wrong-secret, expired, and role-less JWTs", async () => {
    process.env.JWT_SECRET = "test-strong-secret-for-unit-tests-123456";

    // Unsigned alg:none JWT
    const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
    const body = Buffer.from(JSON.stringify({ userId: "hacker", role: "admin" })).toString("base64url");
    const unsignedJwt = `${header}.${body}.`;

    const wrongSecretJwt = await signTestJwt(
      { userId: "hacker", role: "admin" },
      "completely-different-wrong-secret-00000"
    );

    const expiredJwt = await signTestJwt(
      { userId: "admin1", role: "admin" },
      process.env.JWT_SECRET,
      "-10s"
    );

    const rolelessJwt = await signTestJwt(
      { userId: "u1" },
      process.env.JWT_SECRET
    );

    for (const badToken of [
      unsignedJwt,
      wrongSecretJwt,
      expiredJwt,
      rolelessJwt,
      "not.a.jwt",
    ]) {
      const res = await middleware(makeRequest("/admin/users", badToken));
      expect(res.status).toBe(307);
      expect(getRedirectPathname(res)).toBe("/login");
    }
  });

  test("uses config.ts dev fallback secret in non-production when JWT_SECRET is unset (and rejects old insecure fallback)", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";
    delete process.env.JWT_SECRET;

    const validDevToken = await signTestJwt(
      { userId: "admin1", role: "admin" },
      DEV_FALLBACK_SECRET
    );
    const oldFallbackToken = await signTestJwt(
      { userId: "admin1", role: "admin" },
      OLD_INSECURE_FALLBACK
    );

    const okRes = await middleware(makeRequest("/admin", validDevToken));
    expect(isNextPassThrough(okRes)).toBe(true);

    const badRes = await middleware(makeRequest("/admin", oldFallbackToken));
    expect(badRes.status).toBe(307);
    expect(getRedirectPathname(badRes)).toBe("/login");
  });

  test("fails closed in production when JWT_SECRET is unset or blank", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    delete process.env.JWT_SECRET;

    const devFallbackToken = await signTestJwt(
      { userId: "admin1", role: "admin" },
      DEV_FALLBACK_SECRET
    );

    const resUnset = await middleware(makeRequest("/admin", devFallbackToken));
    expect(resUnset.status).toBe(307);
    expect(getRedirectPathname(resUnset)).toBe("/login");

    process.env.JWT_SECRET = "   ";
    const resBlank = await middleware(makeRequest("/admin/users", devFallbackToken));
    expect(resBlank.status).toBe(307);
    expect(getRedirectPathname(resBlank)).toBe("/login");

    // When a real JWT_SECRET IS set in production, verification succeeds
    process.env.JWT_SECRET = "real-production-secret-minimum-32-chars!!";
    const prodToken = await signTestJwt(
      { userId: "admin1", role: "admin" },
      process.env.JWT_SECRET
    );
    const resValidProd = await middleware(makeRequest("/admin/users", prodToken));
    expect(isNextPassThrough(resValidProd)).toBe(true);
  });
});

describe("P0-F1: Pre-Consent PII & Password Hash Sanitization", () => {
  const sensitiveFields = [
    "password",
    "phone",
    "email",
    "emailVerificationOtp",
    "emailVerificationOtpExpiry",
    "resetPasswordOtp",
    "resetPasswordOtpExpiry",
  ];

  const rawDbDonor = {
    _id: { toString: () => "donor_obj_1" },
    name: "Ali Raza",
    bloodType: "O-" as const,
    city: "Karachi",
    role: "donor",
    isAvailable: true,
    isEmailVerified: true,
    lastDonatedAt: null,
    location: { type: "Point", coordinates: [67.0011, 24.8607] as [number, number] },
    createdAt: "2025-01-01T00:00:00.000Z",
    // Sensitive fields that must NEVER leak pre-consent:
    password: "$2a$10$hashedBcryptPasswordExampleValue",
    phone: "03001234567",
    email: "ali.raza@example.com",
    emailVerificationOtp: "123456",
    emailVerificationOtpExpiry: "2026-01-01T00:00:00.000Z",
    resetPasswordOtp: "654321",
    resetPasswordOtpExpiry: "2026-01-01T00:00:00.000Z",
  };

  test("Mongoose query projection allowlists exclude all sensitive/PII fields", () => {
    for (const proj of [SAFE_DONOR_PROJECTION, SAFE_DONOR_DIRECTORY_PROJECTION]) {
      const tokens = proj.split(/\s+/);
      for (const field of sensitiveFields) {
        expect(tokens).not.toContain(field);
      }
    }
  });

  test("sanitizeDonorForMatch strips password, phone, email, and OTP fields pre-consent", () => {
    const safeDonor = sanitizeDonorForMatch(rawDbDonor);

    expect(safeDonor._id).toBe("donor_obj_1");
    expect(safeDonor.name).toBe("Ali Raza");
    expect(safeDonor.bloodType).toBe("O-");
    expect(safeDonor.city).toBe("Karachi");
    expect(safeDonor.role).toBe("donor");
    expect(safeDonor.isAvailable).toBe(true);
    expect(safeDonor.isEmailVerified).toBe(true);
    expect(safeDonor.location).toEqual({
      type: "Point",
      coordinates: [67.0011, 24.8607],
    });

    const safeDonorRecord = safeDonor as unknown as Record<string, unknown>;
    for (const field of sensitiveFields) {
      expect(safeDonorRecord[field]).toBeUndefined();
      expect(Object.prototype.hasOwnProperty.call(safeDonor, field)).toBe(false);
    }
  });

  test("sanitizeMatchResults enforces consent gate across matching engine output", () => {
    const candidate1 = sanitizeDonorForMatch(rawDbDonor);
    const candidate2 = sanitizeDonorForMatch({
      ...rawDbDonor,
      _id: "donor_obj_2",
      name: "Sara Khan",
      bloodType: "A+",
    });

    const matches = findEligibleDonors(
      { _id: "req_1", bloodType: "A+", city: "Karachi" },
      [candidate1, candidate2]
    );
    expect(matches.length).toBe(2);

    // Pre-consent: ZERO donors have phone/email/password/OTP exposed
    const preConsent = sanitizeMatchResults(matches);
    for (const m of preConsent) {
      expect(m.hasConsent).toBe(false);
      const donorRecord = m.donor as unknown as Record<string, unknown>;
      for (const field of sensitiveFields) {
        expect(donorRecord[field]).toBeUndefined();
      }
    }

    // Post-consent for donor_obj_2 ONLY: phone/email revealed ONLY for donor_obj_2, password/OTPs STILL stripped
    const consentMap = new Map([
      ["donor_obj_2", { phone: "03119998888", email: "sara@example.com" }],
    ]);
    const mixedConsent = sanitizeMatchResults(matches, consentMap);

    const consentedMatch = mixedConsent.find((m) => m.donor._id === "donor_obj_2")!;
    const unconsentedMatch = mixedConsent.find((m) => m.donor._id === "donor_obj_1")!;

    const consentedDonorRecord = consentedMatch.donor as unknown as Record<string, unknown>;
    expect(consentedMatch.hasConsent).toBe(true);
    expect(consentedMatch.donor.phone).toBe("03119998888");
    expect(consentedMatch.donor.email).toBe("sara@example.com");
    expect(consentedDonorRecord.password).toBeUndefined();
    expect(consentedDonorRecord.emailVerificationOtp).toBeUndefined();

    const unconsentedDonorRecord = unconsentedMatch.donor as unknown as Record<string, unknown>;
    expect(unconsentedMatch.hasConsent).toBe(false);
    expect(unconsentedMatch.donor.phone).toBeUndefined();
    expect(unconsentedMatch.donor.email).toBeUndefined();
    expect(unconsentedDonorRecord.password).toBeUndefined();
  });

  test("sanitizeDonorForDirectory strips phone, email, password, and OTPs unconditionally", () => {
    const dirDonor = sanitizeDonorForDirectory({ ...rawDbDonor, matchScore: 95 });
    expect(dirDonor._id).toBe("donor_obj_1");
    expect(dirDonor.name).toBe("Ali Raza");
    expect(dirDonor.matchScore).toBe(95);

    const dirDonorRecord = dirDonor as unknown as Record<string, unknown>;
    for (const field of sensitiveFields) {
      expect(dirDonorRecord[field]).toBeUndefined();
      expect(Object.prototype.hasOwnProperty.call(dirDonor, field)).toBe(false);
    }
  });

  test("API route files enforce query-level safe projections without pre-consent phone selection", () => {
    const root = join(import.meta.dir, "..");

    const reqMatchRoute = readFileSync(
      join(root, "src/app/api/requests/[id]/match/route.ts"),
      "utf8"
    );
    expect(reqMatchRoute).toContain(".select(SAFE_DONOR_PROJECTION)");
    expect(reqMatchRoute).toContain("sanitizeMatchResults");

    const generalMatchRoute = readFileSync(
      join(root, "src/app/api/match/route.ts"),
      "utf8"
    );
    expect(generalMatchRoute).toContain(".select(SAFE_DONOR_DIRECTORY_PROJECTION)");
    expect(generalMatchRoute).toContain("sanitizeDonorForDirectory");
    expect(generalMatchRoute).not.toContain("city phone");

    const donorsRoute = readFileSync(
      join(root, "src/app/api/donors/route.ts"),
      "utf8"
    );
    expect(donorsRoute).toContain(".select(SAFE_DONOR_DIRECTORY_PROJECTION)");
    expect(donorsRoute).toContain("sanitizeDonorForDirectory");
    expect(donorsRoute).not.toContain("city phone");
  });
});
