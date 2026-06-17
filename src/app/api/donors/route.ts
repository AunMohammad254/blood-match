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

    const query: FilterQuery<any> = { role: "donor", isAvailable: true };

    if (bloodType && BLOOD_TYPES.includes(bloodType as BloodType)) {
      query.bloodType = { $in: getCompatibleDonorTypes(bloodType as BloodType) };
    }

    if (city && city.trim()) {
      // Optimized: Exact match for indexed field
      query.city = city.trim();
    }

    const donors = await User.find(query)
      .select("name bloodType city phone isAvailable lastDonatedAt createdAt")
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({ donors }, { status: 200 });
  } catch (err) {
    console.error("[GET_/api/donors]", err);
    return NextResponse.json({ error: "Server error.", debug: (err as Error)?.message, uri_defined: !!process.env.MONGODB_URI, uri_starts: process.env.MONGODB_URI?.substring(0, 20) }, { status: 500 });
  }
}
