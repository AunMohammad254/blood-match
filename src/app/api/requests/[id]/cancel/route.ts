/**
 * @route ${routePath}
 * @description API Endpoint Handler
 * @access Internal/Authenticated
 */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { BloodRequest } from "@/lib/models/BloodRequest";
import { verifyAuth } from "@/lib/middleware/auth";
import { invalidateCache } from "@/lib/cache";
import { logger } from "@/lib/logger";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    await connectDB();
    const user = verifyAuth(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = params;
    const bloodRequest = await BloodRequest.findById(id);

    if (!bloodRequest) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }

    if (bloodRequest.requestedBy.toString() !== user.userId) {
      return NextResponse.json(
        { error: "You can only cancel your own requests." },
        { status: 403 }
      );
    }

    if (bloodRequest.status !== "open") {
      return NextResponse.json(
        { error: "Only open requests can be cancelled." },
        { status: 400 }
      );
    }

    bloodRequest.status = "cancelled";
    await bloodRequest.save();

    invalidateCache("requests");

    return NextResponse.json({ message: "Request cancelled." }, { status: 200 });
  } catch (err) {
    logger.error("[PATCH_/api/requests/[id]/cancel]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
