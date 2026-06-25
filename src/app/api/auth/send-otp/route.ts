import { NextRequest, NextResponse } from "next/server";
import { User } from "@/lib/models/User";
import { dbConnect } from "@/lib/db";
import { verifyAuth } from "@/lib/middleware/auth";
import { sendSMS } from "@/lib/sms";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const decoded = await verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.isPhoneVerified) {
      return NextResponse.json({ error: "Phone number is already verified" }, { status: 400 });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    user.verificationOtp = otp;
    user.verificationOtpExpiry = expiry;
    await user.save();

    // Send SMS
    const message = `Your BloodMatch verification code is: ${otp}. It will expire in 5 minutes.`;
    const smsResult = await sendSMS(user.phone, message);

    return NextResponse.json({ 
      success: true, 
      message: "OTP sent successfully",
      provider: smsResult.provider
    });
  } catch (error: any) {
    console.error("Send OTP Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
