import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { verifyAuth } from "@/lib/middleware/auth";

export async function PATCH(req: Request) {
  try {
    await connectDB();
    const decoded = verifyAuth(req);

    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, city } = body;

    // Validation
    if (name && (name.trim().length < 2 || name.trim().length > 60)) {
      return NextResponse.json({ error: "Name must be between 2 and 60 characters." }, { status: 400 });
    }

    const phoneRegex = /^\d{10,}$/;
    if (phone && !phoneRegex.test(phone.trim())) {
      return NextResponse.json({ error: "Phone must be at least 10 digits." }, { status: 400 });
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (phone) updateData.phone = phone.trim();
    if (city) updateData.city = city.trim();

    const updatedUser = await User.findByIdAndUpdate(
      decoded.userId,
      { $set: updateData },
      { new: true }
    ).select("-password -__v");

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

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
          isAvailable: updatedUser.isAvailable
        }
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[PATCH_/api/user/profile]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
