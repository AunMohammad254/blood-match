/**
 * @route POST /api/requests/[id]/match
 * @description Runs the pure deterministic matching engine on a verified blood request.
 * @access Authenticated (Owner, Coordinator, Admin)
 */
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { BloodRequest } from "@/lib/models/BloodRequest";
import { User } from "@/lib/models/User";
import { DonorMatch } from "@/lib/models/DonorMatch";
import { verifyAuth } from "@/lib/middleware/auth";
import { findEligibleDonors } from "@/lib/matching-engine";
import { invalidateCache } from "@/lib/cache";
import { logger } from "@/lib/logger";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
): Promise<Response> {
  try {
    const user = verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    await connectDB();
    const requestId = params.id;

    const bloodRequest = await BloodRequest.findById(requestId);
    if (!bloodRequest) {
      return NextResponse.json({ error: "Blood request not found." }, { status: 404 });
    }

    // Role Gate: Owner of the request, coordinator, or admin
    const isOwner = bloodRequest.requestedBy.toString() === user.userId;
    const isPrivileged = user.role === "admin" || user.role === "coordinator";

    if (!isOwner && !isPrivileged) {
      return NextResponse.json(
        { error: "Forbidden. Only the request owner, coordinators, or administrators can run matching." },
        { status: 403 }
      );
    }

    // Pre-condition: Request must be verified or open
    if (bloodRequest.status !== "verified" && bloodRequest.status !== "open" && bloodRequest.status !== "pending") {
      return NextResponse.json(
        { error: `Cannot run matching for a request with status '${bloodRequest.status}'.` },
        { status: 400 }
      );
    }

    // Unverified check
    if (bloodRequest.status === "pending" && !bloodRequest.isVerified) {
      return NextResponse.json(
        { error: "Request must be verified by a hospital verifier before matching donors." },
        { status: 400 }
      );
    }

    // 1. Fetch potential candidate donors in the request's city
    const candidateDonors = await User.find({
      role: "donor",
      isAvailable: true,
      city: bloodRequest.city.trim(),
    }).lean();

    // 2. Execute deterministic matching engine
    const eligibleMatches = findEligibleDonors(
      {
        _id: bloodRequest._id.toString(),
        bloodType: bloodRequest.bloodType,
        city: bloodRequest.city,
        hospital: bloodRequest.hospital,
        urgency: bloodRequest.urgency,
      },
      candidateDonors as any
    );

    // 3. Persist DonorMatch records (upsert / update rank)
    const matchRecords = [];
    for (const matchResult of eligibleMatches) {
      const donorId = matchResult.donor._id;
      
      const matchDoc = await DonorMatch.findOneAndUpdate(
        { requestId: bloodRequest._id, donorId },
        {
          requestId: bloodRequest._id,
          donorId,
          rank: matchResult.rank,
          status: "pending",
          matchedAt: new Date(),
        },
        { upsert: true, new: true }
      );
      matchRecords.push(matchDoc);
    }

    // 4. Update request status to 'matched'
    bloodRequest.status = "matched";
    await bloodRequest.save();

    invalidateCache("requests");

    return NextResponse.json(
      {
        message: `Matching engine completed. ${eligibleMatches.length} eligible donor(s) matched.`,
        totalMatches: eligibleMatches.length,
        matches: eligibleMatches,
        request: bloodRequest,
      },
      { status: 200 }
    );
  } catch (err: any) {
    logger.error("[POST_/api/requests/[id]/match]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
