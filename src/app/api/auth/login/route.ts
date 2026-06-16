import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { checkRateLimit, getIdentifier } from "@/lib/middleware/rateLimiter";


export async function POST(req: Request) {
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
    const { email, password } = body;


    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required." }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET || "a_long_random_secret_string_minimum_32_chars";
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        role: user.role,
        bloodType: user.bloodType
      },
      secret,
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
  } catch (err) {
    console.error("[POST_/api/auth/login]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
