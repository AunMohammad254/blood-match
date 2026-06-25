export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { getCompatibleDonorTypes } from "@/lib/compatibility";
import { BloodType, BLOOD_TYPES } from "@/lib/constants";
import { FilterQuery } from "mongoose";
import { getCache, setCache } from "@/lib/cache";
import { handleETag } from "@/lib/etag";
import { verifyAuth } from "@/lib/middleware/auth";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const bloodType = searchParams.get("bloodType");
    const city = searchParams.get("city");
    
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20")));

    const cooldownDate = new Date(Date.now() - 56 * 24 * 60 * 60 * 1000);
    const query: FilterQuery<any> = {
      role: "donor",
      isAvailable: true,
      $or: [
        { lastDonatedAt: { $exists: false } },
        { lastDonatedAt: null },
        { lastDonatedAt: { $lt: cooldownDate } }
      ]
    };

    if (bloodType && BLOOD_TYPES.includes(bloodType as BloodType)) {
      query.bloodType = { $in: getCompatibleDonorTypes(bloodType as BloodType) };
    }

    if (city && city.trim()) {
      // Optimized: Exact match for indexed field
      query.city = city.trim();
    }

    const user = verifyAuth(req);
    const isAdminOrCoordinator = user && (user.role === "admin" || user.role === "coordinator");
    const selectFields = isAdminOrCoordinator
      ? "name bloodType city phone isAvailable lastDonatedAt createdAt"
      : "name bloodType city isAvailable lastDonatedAt createdAt";

    const cacheKey = `donors:${bloodType || "all"}:${city || "all"}:${page}:${limit}:${isAdminOrCoordinator ? "admin" : "public"}`;
    const cachedData = getCache<any>(cacheKey);

    let resultPayload;
    if (cachedData) {
      resultPayload = cachedData;
    } else {
      const [donors, total] = await Promise.all([
        User.find(query)
          .select(selectFields)
          .sort({ createdAt: 1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        User.countDocuments(query)
      ]);

      resultPayload = {
        donors,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };

      setCache(cacheKey, resultPayload, 60);
    }

    const { response, headers } = handleETag(req, resultPayload);
    if (response) return response;

    return NextResponse.json(resultPayload, { status: 200, headers });
  } catch (err) {
    console.error("[GET_/api/donors]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
