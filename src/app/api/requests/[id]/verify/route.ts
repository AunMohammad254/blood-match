/**
 * @route POST /api/requests/[id]/verify
 * @description Verifies or rejects a pending blood request (hospital verifiers / admin only).
 * @access Hospital Verifiers / Admin
 */
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { BloodRequest } from "@/lib/models/BloodRequest";
import { Verification } from "@/lib/models/Verification";
import { verifyAuth } from "@/lib/middleware/auth";
import { z } from "zod";
import { invalidateCache } from "@/lib/cache";
import { logger } from "@/lib/logger";

const VerifySchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  notes: z.string().optional(),
}).refine(data => {
  if (data.decision === "rejected") {
    return !!data.notes && data.notes.trim().length > 0;
  }
  return true;
}, {
  message: "Actionable rejection notes are required when rejecting a request.",
  path: ["notes"],
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

    // Role check: Only hospital_verifier or admin can verify blood requests
    if (user.role !== "hospital_verifier" && user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden. Only hospital verifiers and administrators can verify requests." },
        { status: 403 }
      );
    }

    await connectDB();
    const requestId = params.id;

    const body = await req.json();
    const validation = VerifySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { decision, notes } = validation.data;
    const isApproved = decision === "approved";

    // Atomically update the blood request to ensure it hasn't been verified concurrently
    const updatedRequest = await BloodRequest.findOneAndUpdate(
      { _id: requestId, status: { $in: ["pending", "open"] } },
      { 
        $set: { 
          status: isApproved ? "verified" : "rejected", 
          isVerified: isApproved 
        } 
      },
      { new: true }
    );

    if (!updatedRequest) {
      // Check if it's not found or if the status just didn't match
      const exists = await BloodRequest.findById(requestId);
      if (!exists) {
        return NextResponse.json({ error: "Blood request not found." }, { status: 404 });
      }
      return NextResponse.json(
        { error: `Cannot verify a request with status '${exists.status}'. Only pending requests can be verified.` },
        { status: 400 }
      );
    }

    // Record the verification decision
    const verificationRecord = await Verification.create({
      requestId: updatedRequest._id,
      verifiedBy: user.userId,
      decision,
      notes: notes?.trim() || "",
    });

    invalidateCache("requests");

    return NextResponse.json(
      {
        message: `Request ${decision} successfully.`,
        verification: verificationRecord,
        request: updatedRequest,
      },
      { status: 200 }
    );
  } catch (err: any) {
    logger.error("[POST_/api/requests/[id]/verify]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
