/**
 * @route POST /api/donor-matches/[id]/respond
 * @description Donor responds to a match invitation (accept creates Consent and reveals contact).
 * @access Matched Donor
 */
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { DonorMatch } from "@/lib/models/DonorMatch";
import { Consent } from "@/lib/models/Consent";
import { BloodRequest } from "@/lib/models/BloodRequest";
import { verifyAuth } from "@/lib/middleware/auth";
import { z } from "zod";
import { invalidateCache } from "@/lib/cache";
import { logger } from "@/lib/logger";

const RespondSchema = z.object({
  action: z.enum(["accept", "decline"]),
});

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
    const matchId = params.id;

    const matchDoc = await DonorMatch.findById(matchId);
    if (!matchDoc) {
      return NextResponse.json({ error: "Match record not found." }, { status: 404 });
    }

    // Role check: Only the matched donor can respond
    if (matchDoc.donorId.toString() !== user.userId) {
      return NextResponse.json(
        { error: "Forbidden. You can only respond to match invitations sent to you." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validation = RespondSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { action } = validation.data;
    const isAccepted = action === "accept";

    matchDoc.status = isAccepted ? "accepted" : "declined";
    await matchDoc.save();

    let consentRecord = null;
    if (isAccepted) {
      consentRecord = await Consent.findOneAndUpdate(
        { donorMatchId: matchDoc._id },
        {
          donorMatchId: matchDoc._id,
          donorId: user.userId,
          requestId: matchDoc.requestId,
          consentedAt: new Date(),
        },
        { upsert: true, new: true }
      );

      // Advance blood request status to 'contacted' if it's currently 'matched'
      const request = await BloodRequest.findById(matchDoc.requestId);
      if (request && (request.status === "matched" || request.status === "open" || request.status === "verified")) {
        request.status = "contacted";
        request.matchedDonor = user.userId as any;
        await request.save();
      }
    }

    invalidateCache("requests");

    return NextResponse.json(
      {
        message: `Match invitation ${action}ed successfully.`,
        match: matchDoc,
        consent: consentRecord,
      },
      { status: 200 }
    );
  } catch (err: any) {
    logger.error("[POST_/api/donor-matches/[id]/respond]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
