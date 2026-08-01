/**
 * @route POST /api/auth/forgot-password
 * @description Initiates a password reset flow by sending a 6-digit OTP code to the specified email.
 * @access Public
 */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { sendPasswordResetOtpEmail } from "@/lib/email";
import { checkRateLimit, getIdentifier } from "@/lib/middleware/rateLimiter";
import { z } from "zod";
import { logger } from "@/lib/logger";

const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(req: Request): Promise<Response> {
  try {
    // Rate limit: 3 password reset requests per 15 minutes per IP
    const rl = checkRateLimit(getIdentifier(req), { limit: 3, windowMs: 15 * 60 * 1000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many password reset requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      );
    }

    const body = await req.json();
    const validation = ForgotPasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid email address format." },
        { status: 400 }
      );
    }

    const email = validation.data.email.toLowerCase().trim();
    await connectDB();

    const user = await User.findOne({ email });
    if (user) {
      // Generate a 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      user.resetPasswordOtp = otp;
      user.resetPasswordOtpExpiry = otpExpiry;
      await user.save();

      // Send reset OTP email
      try {
        await sendPasswordResetOtpEmail(user.email, otp);
      } catch (emailErr) {
        logger.error(`[POST_/api/auth/forgot-password] Failed to send email to ${user.email}`, emailErr);
      }
    }

    // Always return success to prevent email enumeration attacks
    return NextResponse.json(
      { message: "If an account exists with this email, a reset code has been sent." },
      { status: 200 }
    );
  } catch (err: any) {
    logger.error("[POST_/api/auth/forgot-password]", err);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
