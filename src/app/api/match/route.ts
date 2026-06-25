export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { getCompatibleDonorTypes } from "@/lib/compatibility";
import { BloodType, BLOOD_TYPES } from "@/lib/constants";
import { FilterQuery } from "mongoose";
import { verifyAuth } from "@/lib/middleware/auth";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const bloodType = searchParams.get("bloodType");
    const city = searchParams.get("city");
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const maxDistance = searchParams.get("maxDistance") || "10000"; // Default 10km

    if (!bloodType) {
      return NextResponse.json({ error: "bloodType is required." }, { status: 400 });
    }

    if (!BLOOD_TYPES.includes(bloodType as BloodType)) {
      return NextResponse.json({ error: "Invalid blood type." }, { status: 400 });
    }

    const compatibleTypes = getCompatibleDonorTypes(bloodType as BloodType);

    const cooldownDate = new Date(Date.now() - 56 * 24 * 60 * 60 * 1000);
    const query: FilterQuery<any> = {
      role: "donor",
      isAvailable: true,
      bloodType: { $in: compatibleTypes },
      $or: [
        { lastDonatedAt: { $exists: false } },
        { lastDonatedAt: null },
        { lastDonatedAt: { $lt: cooldownDate } }
      ]
    };

    if (city && city.trim()) {
      query.city = city.trim();
    }

    let isProximitySearch = false;
    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      if (!isNaN(latitude) && !isNaN(longitude)) {
        query.location = {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [longitude, latitude] // GeoJSON format: [lng, lat]
            },
            $maxDistance: parseInt(maxDistance, 10)
          }
        };
        isProximitySearch = true;
      }
    }

    const user = verifyAuth(req);
    const isAdminOrCoordinator = user && (user.role === "admin" || user.role === "coordinator");

    const selectFields = isAdminOrCoordinator
      ? "name bloodType city phone isAvailable lastDonatedAt createdAt"
      : "name bloodType city isAvailable lastDonatedAt createdAt";

    let dbQuery = User.find(query).select(selectFields);
    
    // If using $near, MongoDB automatically sorts by proximity. 
    // Otherwise, fallback to createdAt.
    if (!isProximitySearch) {
      dbQuery = dbQuery.sort({ createdAt: 1 });
    }

    const donors = await dbQuery.lean();

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
