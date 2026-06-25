import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { verifyAuth } from "@/lib/middleware/auth";
import { invalidateCache } from "@/lib/cache";

export async function PATCH(req: Request) {
  try {
    await connectDB();
    const user = verifyAuth(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (user.role !== "donor") {
      return NextResponse.json({ error: "Only donors can update availability." }, { status: 403 });
    }

    const body = await req.json();
    const { isAvailable } = body;

    if (typeof isAvailable !== "boolean") {
      return NextResponse.json({ error: "isAvailable must be a boolean." }, { status: 400 });
    }

    const updatedUser = await User.findByIdAndUpdate(
      user.userId,
      { isAvailable },
      { new: true }
    ).select("-password -__v");

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    invalidateCache("donors");

    return NextResponse.json(
      {
        message: "Availability updated.",
        isAvailable: updatedUser.isAvailable
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[PATCH_/api/donors/availability]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
