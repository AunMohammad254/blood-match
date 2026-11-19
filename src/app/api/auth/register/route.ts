/**
 * @route /api/auth/register
 * @description API Endpoint Handler for User Registration
 * @access Public
 */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import bcrypt from "bcryptjs";
import { checkRateLimit, getIdentifier } from "@/lib/middleware/rateLimiter";
import { RegisterSchema } from "@/lib/validation/schemas";
import { logger } from "@/lib/logger";

export async function POST(req: Request): Promise<Response> {
  try {
    // Rate limit: 3 attempts per hour per IP
    const rl = checkRateLimit(getIdentifier(req), { limit: 3, windowMs: 60 * 60 * 1000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      );
    }

    const body = await req.json();

    // Hard server-side gate: block self-registration for privileged roles with a clear 403
    const PRIVILEGED_ROLES = new Set(["hospital_verifier", "coordinator", "admin"]);
    if (typeof body?.role === "string" && PRIVILEGED_ROLES.has(body.role)) {
      return NextResponse.json(
        {
          error: `Self-registration as '${body.role}' is forbidden. Privileged roles must be assigned by an administrator.`,
        },
        { status: 403 }
      );
    }

    const validationResult = RegisterSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: validationResult.error.flatten().fieldErrors 
        }, 
        { status: 400 }
      );
    }

    const { name, email, password, phone, bloodType, city, role, location } = validationResult.data;

    // Defense-in-depth allowlist: Public registration is only allowed for donor, patient_attendant, and legacy recipient roles
    if (role !== "donor" && role !== "recipient" && role !== "patient_attendant") {
      return NextResponse.json(
        { error: "Forbidden. Only donor, patient_attendant, and recipient roles can self-register." },
        { status: 403 }
      );
    }

    await connectDB();

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return NextResponse.json({ error: "Email already registered." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone.trim(),
      bloodType,
      city: city.trim(),
      role,
      location
    });

    return NextResponse.json(
      {
        message: "Registered successfully.",
        userId: newUser._id
      },
      { status: 201 }
    );
  } catch (err: any) {
    logger.error("[POST_/api/auth/register]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
