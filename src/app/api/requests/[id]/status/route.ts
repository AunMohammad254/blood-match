/**
 * @route PATCH /api/requests/[id]/status
 * @description Updates a request status along the 8-state fulfillment pipeline with rollback support,
 * automated idempotent fulfillment hooks, and audit logging.
 * @access Request Owner, Coordinator, Admin
 */
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { verifyAuth } from "@/lib/middleware/auth";
import { REQUEST_STATUS } from "@/lib/constants";
import { applyRequestStatusTransition } from "@/lib/expiration";
import { z } from "zod";
import { logger } from "@/lib/logger";

const UpdateStatusSchema = z.object({
  status: z.enum(REQUEST_STATUS as unknown as [string, ...string[]]),
  reason: z.string().optional(),
  override: z.boolean().optional(),
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

    const body = await req.json();
    const validation = UpdateStatusSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectDB();

    const { status: newStatus, reason, override } = validation.data;
    const result = await applyRequestStatusTransition({
      requestId: params.id,
      user,
      newStatus,
      reason,
      override,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.httpStatus });
    }

    if (result.unchanged) {
      return NextResponse.json(
        { message: result.message, request: result.request },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        message: result.message,
        previousStatus: result.previousStatus,
        newStatus: result.newStatus,
        request: result.request,
      },
      { status: 200 }
    );
  } catch (err: any) {
    logger.error("[PATCH_/api/requests/[id]/status]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
