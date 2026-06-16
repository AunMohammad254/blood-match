export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { getCompatibleDonorTypes } from "@/lib/compatibility";
import { BloodType, BLOOD_TYPES } from "@/lib/constants";
import { FilterQuery } from "mongoose";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const bloodType = searchParams.get("bloodType");
    const city = searchParams.get("city");

    if (!bloodType) {
      return NextResponse.json({ error: "bloodType is required." }, { status: 400 });
    }

    if (!BLOOD_TYPES.includes(bloodType as BloodType)) {
      return NextResponse.json({ error: "Invalid blood type." }, { status: 400 });
    }

    const compatibleTypes = getCompatibleDonorTypes(bloodType as BloodType);

    const query: FilterQuery<any> = {
      role: "donor",
      isAvailable: true,
      bloodType: { $in: compatibleTypes }
    };

    if (city && city.trim()) {
      query.city = { $regex: city.trim(), $options: "i" };
    }

    const donors = await User.find(query)
      .select("-password -email -__v")
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json(
      {
        requested: bloodType,
        compatibleTypes,
        totalMatches: donors.length,
        donors
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[GET_/api/match]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
