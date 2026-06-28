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
import { addNotification } from "@/lib/db/notifications";
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

    if (user.role !== "donor") {
      return NextResponse.json(
        { error: "Only registered donors can respond to requests." },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await req.json();
    const { action } = body;

    if (action !== "accept" && action !== "decline") {
      return NextResponse.json(
        { error: "Invalid action. Supported actions: accept, decline." },
        { status: 400 }
      );
    }

    const request = await BloodRequest.findById(id);
    if (!request) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }

    if (request.status !== "open" && action === "accept") {
      return NextResponse.json(
        { error: "Request is no longer open." },
        { status: 400 }
      );
    }

    // Check if the request has expired
    if (request.expiresAt && new Date(request.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "This request has expired." },
        { status: 400 }
      );
    }

    if (action === "accept") {
      request.status = "accepted";
      request.matchedDonor = user.userId as any;
      await request.save();
      
      invalidateCache("requests");
      invalidateCache("donors");

      // Notify the requester
      addNotification(
        request.requestedBy.toString(),
        `A donor has accepted your blood request for ${request.patientName}!`
      );

      // Fetch the updated request with full contact details to return to the donor
      const updatedRequest = await BloodRequest.findById(id)
        .populate("requestedBy", "name city")
        .populate("matchedDonor", "name city phone")
        .lean();

      return NextResponse.json(
        { message: "You have accepted this blood request.", request: updatedRequest },
        { status: 200 }
      );
    } else {
      // Decline: Append user ID to declinedBy list
      if (process.env.MONGODB_URI) {
        await BloodRequest.findByIdAndUpdate(id, {
          $addToSet: { declinedBy: user.userId }
        });
      } else {
        await BloodRequest.findByIdAndUpdate(id, {
          $push: { declinedBy: user.userId }
        });
      }

      invalidateCache("requests");

      return NextResponse.json(
        { message: "You have declined this blood request." },
        { status: 200 }
      );
    }
  } catch (err) {
    logger.error("[PATCH_/api/requests/[id]/respond]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
