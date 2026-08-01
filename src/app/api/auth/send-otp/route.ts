/**
 * @route /api/auth/send-otp
 * @description API Endpoint Handler for sending email OTP
 * @access Internal/Authenticated
 */
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getIdentifier } from "@/lib/middleware/rateLimiter";
import { User } from "@/lib/models/User";
import { connectDB } from "@/lib/db/connect";
import { verifyAuth } from "@/lib/middleware/auth";
import { sendOtpEmail } from "@/lib/email";
import crypto from "crypto";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const rl = checkRateLimit(getIdentifier(req) + "_send_otp", { limit: 5, windowMs: 60 * 60 * 1000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      );
    }
    await connectDB();
    const decoded = await verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      return NextResponse.json(
        { error: "User session not found. Please log out and log in again." },
        { status: 404 }
      );
    }

    if (user.isEmailVerified) {
      return NextResponse.json({ error: "Email address is already verified" }, { status: 400 });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    user.emailVerificationOtp = otp;
    user.emailVerificationOtpExpiry = expiry;
    await user.save();

    // Send Email OTP
    try {
      await sendOtpEmail(user.email, otp);
    } catch (sendErr) {
      logger.error("[SendOTP] Email delivery failed:", sendErr);
      return NextResponse.json(
        { error: "Failed to send OTP email. Please verify email credentials." },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: "OTP sent to your email successfully"
    });
  } catch (error) {
    logger.error("Send OTP Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
