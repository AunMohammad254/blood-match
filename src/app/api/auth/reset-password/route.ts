/**
 * @route POST /api/auth/reset-password
 * @description Verifies the password reset OTP and sets a new password for the account.
 * @access Public
 */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import bcrypt from "bcryptjs";
import { checkRateLimit, getIdentifier } from "@/lib/middleware/rateLimiter";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { StrongPasswordSchema } from "@/lib/validation/schemas/auth.schema";

const ResetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "Verification code must be exactly 6 digits"),
  newPassword: StrongPasswordSchema,
});

export async function POST(req: Request): Promise<Response> {
  try {
    // Rate limit: 5 reset attempts per 15 minutes per IP
    const rl = checkRateLimit(getIdentifier(req), { limit: 5, windowMs: 15 * 60 * 1000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many reset attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      );
    }

    const body = await req.json();
    const validation = ResetPasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed.", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, otp, newPassword } = validation.data;
    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.resetPasswordOtp || !user.resetPasswordOtpExpiry) {
      return NextResponse.json(
        { error: "Invalid or expired reset request. Please request a new code." },
        { status: 400 }
      );
    }

    if (user.resetPasswordOtp !== otp.trim()) {
      return NextResponse.json({ error: "Invalid verification code." }, { status: 400 });
    }

    if (new Date() > new Date(user.resetPasswordOtpExpiry)) {
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new code." },
        { status: 400 }
      );
    }

    // Hash the new password and update user
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpiry = undefined;
    await user.save();

    return NextResponse.json(
      { message: "Password updated successfully. You can now log in with your new password." },
      { status: 200 }
    );
  } catch (err: any) {
    logger.error("[POST_/api/auth/reset-password]", err);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
