/**
 * @route ${routePath}
 * @description API Endpoint Handler
 * @access Internal/Authenticated
 */
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { BloodRequest } from "@/lib/models/BloodRequest";
import { verifyAuth } from "@/lib/middleware/auth";
import { invalidateCache } from "@/lib/cache";
import { logger } from "@/lib/logger";
import { sendAdminAlertEmail } from "@/lib/email";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    await connectDB();
    const user = verifyAuth(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const updated = await BloodRequest.findOneAndUpdate(
      { _id: params.id, reportedBy: { $ne: user.userId } },
      { 
        $inc: { reports: 1 }, 
        $addToSet: { reportedBy: user.userId } 
      },
      { new: true }
    );

    if (!updated) {
      const existing = await BloodRequest.findById(params.id);
      if (!existing) {
        return NextResponse.json({ error: "Request not found." }, { status: 404 });
      }
      return NextResponse.json({ error: "You have already reported this request." }, { status: 400 });
    }

    if (updated.reports >= 3) {
      sendAdminAlertEmail(
        "Heavily Reported Blood Request",
        `Blood request ${updated._id} for patient "${updated.patientName}" has accumulated ${updated.reports} reports. Please review it in the admin console.`
      ).catch((err) => logger.error("[AdminAlert:reportedRequest]", err));
    }

    invalidateCache("requests");

    return NextResponse.json({ message: "Request reported successfully.", reports: updated.reports }, { status: 200 });
  } catch (err) {
    logger.error("[POST_/api/requests/[id]/report]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
