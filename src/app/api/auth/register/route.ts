import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import bcrypt from "bcryptjs";
import { BLOOD_TYPES } from "@/lib/constants";
import { checkRateLimit, getIdentifier } from "@/lib/middleware/rateLimiter";

export async function POST(req: Request) {
  try {
    // Rate limit: 10 registrations per hour per IP
    const rl = checkRateLimit(getIdentifier(req), { limit: 10, windowMs: 60 * 60 * 1000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      );
    }

    await connectDB();
    const body = await req.json();
    const { name, email, password, phone, bloodType, city, role } = body;

    if (!name || !email || !password || !phone || !bloodType || !city || !role) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    if (name.trim().length < 2 || name.trim().length > 60) {
      return NextResponse.json({ error: "Name must be between 2 and 60 characters." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const phoneRegex = /^\d{10,}$/;
    if (!phoneRegex.test(phone.trim())) {
      return NextResponse.json({ error: "Phone must be at least 10 digits." }, { status: 400 });
    }

    if (!BLOOD_TYPES.includes(bloodType)) {
      return NextResponse.json({ error: "Invalid blood type." }, { status: 400 });
    }

    if (role !== "donor" && role !== "recipient") {
      return NextResponse.json({ error: "Role must be donor or recipient." }, { status: 400 });
    }

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
      role
    });

    return NextResponse.json(
      {
        message: "Registered successfully.",
        userId: newUser._id
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST_/api/auth/register]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
