/**
 * @route ${routePath}
 * @description API Endpoint Handler
 * @access Internal/Authenticated
 */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { checkRateLimit, getIdentifier } from "@/lib/middleware/rateLimiter";
import { LoginSchema } from "@/lib/validation/schemas";
import { config } from "@/lib/config";
import { logger } from "@/lib/logger";

export async function POST(req: Request): Promise<Response> {
  try {
    // Rate limit: 5 attempts per 15 minutes per IP
    const rl = checkRateLimit(getIdentifier(req), { limit: 5, windowMs: 15 * 60 * 1000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      );
    }

    await connectDB();
    const body = await req.json();

    const validationResult = LoginSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: validationResult.error.flatten().fieldErrors 
        }, 
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        role: user.role,
        bloodType: user.bloodType
      },
      config.jwtSecret,
      { expiresIn: "7d" }
    );

    return NextResponse.json(
      {
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          bloodType: user.bloodType,
          city: user.city,
          phone: user.phone,
          isAvailable: user.isAvailable,
          lastDonatedAt: user.lastDonatedAt,
          createdAt: user.createdAt
        }
      },
      { status: 200 }
    );
  } catch (err: any) {
    logger.error("[POST_/api/auth/login]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
