/**
 * @route PATCH /api/auth/change-password
 * @description API route handler for PATCH /api/auth/change-password
 * @access Authenticated
 */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { verifyAuth } from "@/lib/middleware/auth";
import bcrypt from "bcryptjs";
import { checkRateLimit, getIdentifier } from "@/lib/middleware/rateLimiter";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { StrongPasswordSchema } from "@/lib/validation/schemas/auth.schema";

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: StrongPasswordSchema,
});

export async function PATCH(req: Request): Promise<Response> {
  try {
    // Rate limit: 5 attempts per 15 minutes per IP
    const rl = checkRateLimit(getIdentifier(req), { limit: 5, windowMs: 15 * 60 * 1000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      );
    }

    await connectDB();
    const decoded = verifyAuth(req);

    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const validation = ChangePasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = validation.data;

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Incorrect current password." }, { status: 401 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return NextResponse.json(
      { message: "Password updated successfully." },
      { status: 200 }
    );
  } catch (err: any) {
    logger.error("[PATCH_/api/auth/change-password]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
