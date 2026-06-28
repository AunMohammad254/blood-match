/**
 * @route ${routePath}
 * @description API Endpoint Handler
 * @access Internal/Authenticated
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

    await connectDB();
    const body = await req.json();

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

    const { name, email, password, phone, bloodType, city, role } = validationResult.data;
    const location = body.location; // extract location if provided

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
