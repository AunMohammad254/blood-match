/**
 * @route GET/PATCH/DELETE /api/user/profile
 * @description API route handler for GET/PATCH/DELETE /api/user/profile
 * @access Authenticated
 */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { BloodRequest } from "@/lib/models/BloodRequest";
import { Notification } from "@/lib/models/Notification";
import { ChatHistory } from "@/lib/models/ChatHistory";
import { verifyAuth } from "@/lib/middleware/auth";
import { invalidateCache } from "@/lib/cache";
import { logger } from "@/lib/logger";
import { UpdateProfileSchema } from "@/lib/validation/schemas";
import bcrypt from "bcryptjs";

export async function GET(req: Request): Promise<Response> {
  try {
    await connectDB();
    const decoded = verifyAuth(req);

    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const user = await User.findById(decoded.userId).select("-password -__v");
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({
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
    });
  } catch (err: any) {
    logger.error("[GET_/api/user/profile]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

export async function PATCH(req: Request): Promise<Response> {
  try {
    await connectDB();
    const decoded = verifyAuth(req);

    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const validationResult = UpdateProfileSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: validationResult.error.flatten().fieldErrors 
        }, 
        { status: 400 }
      );
    }

    const { name, phone, city, lastDonatedAt } = validationResult.data;

    const updateData: Record<string, any> = {};
    if (name) updateData.name = name.trim();
    if (phone) updateData.phone = phone.trim();
    if (city) updateData.city = city.trim();
    if (lastDonatedAt !== undefined) updateData.lastDonatedAt = lastDonatedAt ? new Date(lastDonatedAt) : null;

    const updatedUser = await User.findByIdAndUpdate(
      decoded.userId,
      { $set: updateData },
      { new: true }
    ).select("-password -__v");

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    invalidateCache("donors");

    return NextResponse.json(
      {
        message: "Profile updated successfully.",
        user: {
          id: updatedUser._id.toString(),
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          bloodType: updatedUser.bloodType,
          city: updatedUser.city,
          phone: updatedUser.phone,
          isAvailable: updatedUser.isAvailable,
          lastDonatedAt: updatedUser.lastDonatedAt
        }
      },
      { status: 200 }
    );
  } catch (err: any) {
    logger.error("[PATCH_/api/user/profile]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

export async function DELETE(req: Request): Promise<Response> {
  try {
    await connectDB();
    const decoded = verifyAuth(req);

    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { password } = body;

    if (!password) {
      return NextResponse.json({ error: "Password confirmation is required to delete account." }, { status: 400 });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Incorrect password. Account deletion cancelled." }, { status: 401 });
    }

    // Perform cascading cleanup for user-owned resources
    await Promise.all([
      BloodRequest.deleteMany({ requestedBy: decoded.userId }),
      BloodRequest.updateMany({ matchedDonor: decoded.userId }, { $unset: { matchedDonor: "" }, $set: { status: "open" } }),
      Notification.deleteMany({ userId: decoded.userId }),
      ChatHistory.deleteMany({ userId: decoded.userId }),
      User.findByIdAndDelete(decoded.userId)
    ]);

    invalidateCache("donors");
    invalidateCache("requests");

    return NextResponse.json({ message: "Account and associated data deleted successfully." }, { status: 200 });
  } catch (err: any) {
    logger.error("[DELETE_/api/user/profile]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
