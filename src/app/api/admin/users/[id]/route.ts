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

const UpdateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").optional(),
  email: z.string().email("Invalid email address.").optional(),
  phone: z.string().min(10, "Phone number must be at least 10 characters.").optional(),
  bloodType: z.enum(BLOOD_TYPES as unknown as [string, ...string[]]).optional(),
  city: z.string().min(2, "City must be at least 2 characters.").optional(),
  role: z.enum(["donor", "recipient", "admin"]).optional(),
  isAvailable: z.boolean().optional(),
  password: z.string().min(6, "Password must be at least 6 characters.").optional(),
});

// PATCH — Update user (full profile, toggle availability, change role, reset password)
export async function PATCH(req: Request, { params }: { params: { id: string } }): Promise<NextResponse> {
  try {
    const admin = requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden. Admin access only." }, { status: 403 });
    }

    await connectDB();
    const { id } = params;
    const body = await req.json();

    // Validate request body
    const result = UpdateUserSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues.map((e) => e.message).join(" ");
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const data = result.data;
    const updateData: Record<string, any> = {};

    if (data.name) updateData.name = data.name.trim();
    if (data.email) updateData.email = data.email.toLowerCase().trim();
    if (data.phone) updateData.phone = data.phone.trim();
    if (data.city) updateData.city = data.city.trim();
    if (data.bloodType) updateData.bloodType = data.bloodType;
    if (data.role) updateData.role = data.role;
    if (typeof data.isAvailable === "boolean") updateData.isAvailable = data.isAvailable;

    // Password reset: Hash password using bcryptjs (10 rounds)
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
    }

    const updated = await User.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const userObj = updated.toObject ? updated.toObject() : { ...updated };
    delete userObj.password;

    return NextResponse.json({ message: "User updated successfully.", user: userObj });
  } catch (err) {
    logger.error("[PATCH /api/admin/users/[id]]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

// DELETE — Remove a user account
export async function DELETE(req: Request, { params }: { params: { id: string } }): Promise<NextResponse> {
  try {
    const admin = requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden. Admin access only." }, { status: 403 });
    }

    await connectDB();
    const { id } = params;

    // Prevent deleting yourself
    if (id === admin.userId) {
      return NextResponse.json({ error: "Cannot delete your own account." }, { status: 400 });
    }

    const deleted = await User.deleteOne({ _id: id });
    if (!deleted || deleted.deletedCount === 0) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "User deleted successfully." });
  } catch (err) {
    logger.error("[DELETE /api/admin/users/[id]]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
