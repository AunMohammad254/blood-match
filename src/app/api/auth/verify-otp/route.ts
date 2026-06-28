/**
 * @route ${routePath}
 * @description API Endpoint Handler
 * @access Internal/Authenticated
 */
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getIdentifier } from "@/lib/middleware/rateLimiter";
import { User } from "@/lib/models/User";
import { connectDB } from "@/lib/db/connect";
import { verifyAuth } from "@/lib/middleware/auth";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const rl = checkRateLimit(getIdentifier(req) + "_verify_otp", { limit: 10, windowMs: 60 * 60 * 1000 });
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

    const { otp } = await req.json();
    if (!otp) {
      return NextResponse.json({ error: "OTP is required" }, { status: 400 });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.isPhoneVerified) {
      return NextResponse.json({ error: "Phone number is already verified" }, { status: 400 });
    }

    if (!user.verificationOtp || !user.verificationOtpExpiry) {
      return NextResponse.json({ error: "No OTP was requested" }, { status: 400 });
    }

    if (new Date() > new Date(user.verificationOtpExpiry)) {
      return NextResponse.json({ error: "OTP has expired. Please request a new one." }, { status: 400 });
    }

    if (user.verificationOtp !== otp) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    // OTP is valid
    user.isPhoneVerified = true;
    user.verificationOtp = undefined;
    user.verificationOtpExpiry = undefined;
    await user.save();

    return NextResponse.json({ success: true, message: "Phone number verified successfully" });
  } catch (error) {
    logger.error("Verify OTP Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
