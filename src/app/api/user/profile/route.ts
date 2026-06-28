/**
 * @route ${routePath}
 * @description API Endpoint Handler
 * @access Internal/Authenticated
 */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { verifyAuth } from "@/lib/middleware/auth";
import { invalidateCache } from "@/lib/cache";
import { logger } from "@/lib/logger";
import { UpdateProfileSchema } from "@/lib/validation/schemas";

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

    // For safety, we just mark as unavailable and change role to a "deleted" state 
    // or actually delete. Let's do actual deletion for this project.
    const deletedUser = await User.findByIdAndDelete(decoded.userId);

    if (!deletedUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    invalidateCache("donors");

    return NextResponse.json({ message: "Account deleted successfully." }, { status: 200 });
  } catch (err: any) {
    logger.error("[DELETE_/api/user/profile]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
