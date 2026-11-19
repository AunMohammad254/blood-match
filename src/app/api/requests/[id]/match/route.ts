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
import { Consent } from "@/lib/models/Consent";
import { verifyAuth } from "@/lib/middleware/auth";
import { findEligibleDonors } from "@/lib/matching-engine";
import {
  SAFE_DONOR_PROJECTION,
  sanitizeDonorForMatch,
  sanitizeMatchResults,
  type ConsentedDonorContact,
} from "@/lib/privacy";
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

    // 1. Fetch potential candidate donors in the request's city using strict non-PII projection
    // Never select password, phone, email, or OTP fields before Consent exists (Rules.md §5)
    const rawCandidateDonors = (await User.find({
      role: "donor",
      isAvailable: true,
      city: bloodRequest.city.trim(),
    })
      .select(SAFE_DONOR_PROJECTION)
      .lean()) as Array<Record<string, any>>;

    // Strip any unprojected fields (defense-in-depth for in-memory store where .select() is a no-op)
    const candidateDonors = rawCandidateDonors.map((donor) =>
      sanitizeDonorForMatch(donor)
    );

    // 2. Execute deterministic matching engine
    const eligibleMatches = findEligibleDonors(
      {
        _id: bloodRequest._id.toString(),
        bloodType: bloodRequest.bloodType,
        city: bloodRequest.city,
        hospital: bloodRequest.hospital,
        urgency: bloodRequest.urgency,
      },
      candidateDonors
    );

    // 3. Persist DonorMatch records (upsert / update rank)
    for (const matchResult of eligibleMatches) {
      const donorId = matchResult.donor._id;

      if (typeof DonorMatch.findOneAndUpdate === "function") {
        await DonorMatch.findOneAndUpdate(
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
      } else {
        await DonorMatch.create({
          requestId: bloodRequest._id,
          donorId,
          rank: matchResult.rank,
          status: "pending",
          matchedAt: new Date(),
        });
      }
    }

    // 4. Query-level consent gate: reveal phone/email ONLY for donors with a verified Consent for this request
    const existingConsents = (await Consent.find({
      requestId: bloodRequest._id,
    })
      .select("donorId requestId")
      .lean()) as Array<{ donorId?: { toString(): string } | string }>;

    const consentedDonorIds = new Set(
      (existingConsents || [])
        .map((c) => c.donorId?.toString?.() ?? String(c.donorId ?? ""))
        .filter(Boolean)
    );

    const consentedContactByDonorId = new Map<string, ConsentedDonorContact>();
    if (consentedDonorIds.size > 0) {
      const matchedConsentedIds = eligibleMatches
        .map((m) => m.donor._id?.toString?.() ?? String(m.donor._id))
        .filter((id) => consentedDonorIds.has(id));

      if (matchedConsentedIds.length > 0) {
        const consentedUsers = (await User.find({
          _id: { $in: matchedConsentedIds },
        })
          .select("_id phone email")
          .lean()) as Array<{ _id: unknown; phone?: string; email?: string }>;

        for (const cu of consentedUsers || []) {
          const idStr =
            cu._id && typeof (cu._id as { toString?: () => string }).toString === "function"
              ? (cu._id as { toString: () => string }).toString()
              : String(cu._id ?? "");
          if (consentedDonorIds.has(idStr)) {
            consentedContactByDonorId.set(idStr, {
              phone: cu.phone,
              email: cu.email,
            });
          }
        }
      }
    }

    const sanitizedMatches = sanitizeMatchResults(
      eligibleMatches,
      consentedContactByDonorId
    );

    // 5. Update request status to 'matched'
    bloodRequest.status = "matched";
    await bloodRequest.save();

    invalidateCache("requests");

    return NextResponse.json(
      {
        message: `Matching engine completed. ${sanitizedMatches.length} eligible donor(s) matched.`,
        totalMatches: sanitizedMatches.length,
        matches: sanitizedMatches,
        request: bloodRequest,
      },
      { status: 200 }
    );
  } catch (err: any) {
    logger.error("[POST_/api/requests/[id]/match]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
