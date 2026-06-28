/**
 * @route ${routePath}
 * @description API Endpoint Handler
 * @access Internal/Authenticated
 */
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { BloodRequest, IBloodRequest } from "@/lib/models/BloodRequest";
import { verifyAuth } from "@/lib/middleware/auth";
import { FilterQuery, HydratedDocument } from "mongoose";
import { getCache, setCache, invalidateCache } from "@/lib/cache";
import { handleETag } from "@/lib/etag";
import { logger } from "@/lib/logger";
import { CreateRequestSchema } from "@/lib/validation/schemas";
import { checkRateLimit, getIdentifier } from "@/lib/middleware/rateLimiter";

type PopulatedRequest = HydratedDocument<IBloodRequest> & {
  requestedBy: { _id: string; name: string; city: string };
  matchedDonor?: { _id: string; name: string; city: string; phone?: string };
};

export async function GET(req: Request): Promise<Response> {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city");
    const bloodType = searchParams.get("bloodType");
    const status = searchParams.get("status");
    const mine = searchParams.get("mine");
    const acceptedByMe = searchParams.get("acceptedByMe");
    
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20")));

    const filter: FilterQuery<any> = {};
    const user = verifyAuth(req);
    let cacheUserId = "all";

    if (mine === "true") {
      if (!user) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
      }
      filter.requestedBy = user.userId;
      cacheUserId = user.userId;
      if (status && status !== "all") {
        filter.status = status;
      }
    } else if (acceptedByMe === "true") {
      if (!user) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
      }
      filter.matchedDonor = user.userId;
      filter.status = "accepted";
      cacheUserId = `accepted_${user.userId}`;
    } else {
      if (status && status !== "all") {
        filter.status = status;
      } else if (!status) {
        filter.status = "open";
      }

      if (filter.status === "open") {
        filter.isVerified = true;
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        filter.$or = [
          { expiresAt: null, createdAt: { $gt: threeDaysAgo } },
          { expiresAt: { $gt: new Date() } }
        ];

        if (user) {
          filter.declinedBy = { $ne: user.userId };
          cacheUserId = `donor_${user.userId}`;
        }
      }
    }

    if (city && city.trim()) {
      filter.city = city.trim();
    }

    if (bloodType && bloodType !== "all") {
      filter.bloodType = bloodType;
    }

    const cacheKey = `requests:${cacheUserId}:${status || "all"}:${city || "all"}:${bloodType || "all"}:${page}:${limit}`;
    const cachedData = getCache<any>(cacheKey);

    let resultPayload;
    if (cachedData) {
      resultPayload = cachedData;
    } else {
      const urgencyOrder: Record<string, number> = { critical: 0, urgent: 1, normal: 2 };

      const allRequests = await BloodRequest.find(filter)
        .populate("requestedBy", "name city")
        .populate("matchedDonor", "name city phone")
        .select("patientName bloodType units hospital city urgency contactPhone status requestedBy matchedDonor isVerified expiresAt createdAt")
        .sort({ createdAt: -1 })
        .lean() as unknown as PopulatedRequest[];

      allRequests.sort((a: any, b: any) => (urgencyOrder[a.urgency] ?? 99) - (urgencyOrder[b.urgency] ?? 99));

      const total = allRequests.length;
      const paginatedRequests = allRequests.slice((page - 1) * limit, page * limit);

      const cleanedRequests = paginatedRequests.map((r: any) => {
        const requestedById = r.requestedBy?._id?.toString() || r.requestedBy?.toString();
        const matchedDonorId = r.matchedDonor?._id?.toString() || r.matchedDonor?.toString();

        const isOwner = user && requestedById === user.userId;
        const isMatchedDonor = user && matchedDonorId === user.userId;
        const isAdminOrCoordinator = user && (user.role === "admin" || user.role === "coordinator");

        const hasAccess = isOwner || isMatchedDonor || isAdminOrCoordinator;

        const requestCopy = { ...r } as any;

        if (!hasAccess) {
          delete requestCopy.contactPhone;
        }

        if (requestCopy.matchedDonor && typeof requestCopy.matchedDonor === "object") {
          const matchedDonorCopy = { ...requestCopy.matchedDonor };
          const isOwnerOrAdmin = isOwner || isAdminOrCoordinator;
          if (!isOwnerOrAdmin) {
            delete matchedDonorCopy.phone;
          }
          requestCopy.matchedDonor = matchedDonorCopy;
        }

        return requestCopy;
      });

      resultPayload = {
        requests: cleanedRequests,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };

      setCache(cacheKey, resultPayload, 30);
    }

    const { response, headers } = handleETag(req, resultPayload);
    if (response) return response;

    return NextResponse.json(resultPayload, { status: 200, headers });
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    logger.error('Operation failed', { error: err.message, stack: err.stack });
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const rl = checkRateLimit(getIdentifier(req) + "_create_request", { limit: 5, windowMs: 24 * 60 * 60 * 1000 }); // 5 per day
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests created today. Please try again tomorrow." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      );
    }

    await connectDB();
    const user = verifyAuth(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const validationResult = CreateRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: validationResult.error.flatten().fieldErrors 
        }, 
        { status: 400 }
      );
    }

    const { patientName, bloodType, units, hospital, city, urgency, contactPhone } = validationResult.data;

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingRequest = await BloodRequest.findOne({
      requestedBy: user.userId,
      bloodType,
      city: city.trim(),
      status: "open",
      createdAt: { $gt: oneDayAgo }
    });

    if (existingRequest) {
      return NextResponse.json({ error: "You already have an open request for this blood type in this city." }, { status: 409 });
    }

    const newRequest = await BloodRequest.create({
      patientName: patientName.trim(),
      bloodType,
      units,
      hospital: hospital.trim(),
      city: city.trim(),
      urgency,
      contactPhone: contactPhone.trim(),
      requestedBy: user.userId,
      status: "open",
      isVerified: false,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      declinedBy: []
    });

    invalidateCache("requests");

    return NextResponse.json(
      {
        message: "Request created.",
        request: newRequest
      },
      { status: 201 }
    );
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    logger.error('Operation failed', { error: err.message, stack: err.stack });
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
