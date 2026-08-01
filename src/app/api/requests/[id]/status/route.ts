/**
 * @route PATCH /api/requests/[id]/status
 * @description Updates a request status along the 8-state fulfillment pipeline with audit logging for overrides.
 * @access Request Owner, Coordinator, Admin
 */
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { BloodRequest } from "@/lib/models/BloodRequest";
import { AuditLog } from "@/lib/models/AuditLog";
import { verifyAuth } from "@/lib/middleware/auth";
import { REQUEST_STATUS } from "@/lib/constants";
import { z } from "zod";
import { invalidateCache } from "@/lib/cache";
import { logger } from "@/lib/logger";

const UpdateStatusSchema = z.object({
  status: z.enum(REQUEST_STATUS as unknown as [string, ...string[]]),
  reason: z.string().optional(),
});

export async function PATCH(
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

    const isOwner = bloodRequest.requestedBy.toString() === user.userId;
    const isPrivileged = user.role === "admin" || user.role === "coordinator";

    if (!isOwner && !isPrivileged) {
      return NextResponse.json(
        { error: "Forbidden. Only the request owner, coordinators, or administrators can update status." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validation = UpdateStatusSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { status: newStatus, reason } = validation.data;
    const previousStatus = bloodRequest.status;

    bloodRequest.status = newStatus as any;
    
    if (newStatus === "verified") {
      bloodRequest.isVerified = true;
    }

    await bloodRequest.save();

    // Create AuditLog if overridden by admin/coordinator or if reason is provided
    if (isPrivileged || reason) {
      await AuditLog.create({
        action: isPrivileged ? "STATUS_OVERRIDE" : "STATUS_UPDATE",
        performedBy: user.userId,
        targetId: bloodRequest._id,
        details: {
          previousStatus,
          newStatus,
          reason: reason?.trim() || "",
          userRole: user.role,
        },
      });
    }

    invalidateCache("requests");

    return NextResponse.json(
      {
        message: `Status updated to '${newStatus}'.`,
        previousStatus,
        newStatus,
        request: bloodRequest,
      },
      { status: 200 }
    );
  } catch (err: any) {
    logger.error("[PATCH_/api/requests/[id]/status]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
