/**
 * @route ${routePath}
 * @description API Endpoint Handler
 * @access Internal/Authenticated
 */
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { requireAdmin } from "@/lib/middleware/auth";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { BLOOD_TYPES } from "@/lib/constants";
import { logger } from "@/lib/logger";

const CreateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  phone: z.string().min(10, "Phone number must be at least 10 characters."),
  bloodType: z.enum(BLOOD_TYPES as unknown as [string, ...string[]]),
  city: z.string().min(2, "City must be at least 2 characters."),
  role: z.enum(["donor", "recipient", "admin"]),
  isAvailable: z.boolean().optional(),
});

// GET — List users with filters
export async function GET(req: Request): Promise<Response> {
  try {
    const admin = requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden. Admin access only." }, { status: 403 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const city = searchParams.get("city");
    const bloodType = searchParams.get("bloodType");
    const isAvailable = searchParams.get("isAvailable");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "20"));

    const filter: Record<string, any> = {};
    if (role && role !== "all") filter.role = role;
    if (city && city.trim()) filter.city = city.trim();
    if (bloodType && bloodType !== "all") filter.bloodType = bloodType;
    if (isAvailable === "true") filter.isAvailable = true;
    if (isAvailable === "false") filter.isAvailable = false;
    
    if (search && search.trim()) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return NextResponse.json({ users, total, page, limit });
  } catch (err: any) {
    logger.error("[GET /api/admin/users]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

// POST — Create user
export async function POST(req: Request): Promise<Response> {
  try {
    const admin = requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden. Admin access only." }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();

    // Validate request body
    const result = CreateUserSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues.map((e) => e.message).join(" ");
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { name, email, password, phone, bloodType, city, role, isAvailable } = result.data;

    // Check duplicate email
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json({ error: "Email already registered." }, { status: 400 });
    }

    // Hash password (10 rounds)
    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: passwordHash,
      phone: phone.trim(),
      bloodType,
      city: city.trim(),
      role,
      isAvailable: typeof isAvailable === "boolean" ? isAvailable : true,
    });

    const userObj = newUser.toObject ? newUser.toObject() : { ...newUser };
    delete userObj.password;

    return NextResponse.json({ message: "User created successfully.", user: userObj }, { status: 201 });
  } catch (err: any) {
    logger.error("[POST /api/admin/users]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
