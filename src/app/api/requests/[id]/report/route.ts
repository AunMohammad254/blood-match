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

    const request = await BloodRequest.findById(params.id);
    if (!request) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }

    // Check if the user has already reported this request
    if (request.reportedBy && request.reportedBy.includes(user.userId)) {
      return NextResponse.json({ error: "You have already reported this request." }, { status: 400 });
    }

    // Increment reports counter and add user to reportedBy list
    if (!request.reports) request.reports = 0;
    if (!request.reportedBy) request.reportedBy = [];
    
    request.reports += 1;
    request.reportedBy.push(user.userId);
    
    await request.save();

    invalidateCache("requests");

    return NextResponse.json({ message: "Request reported successfully.", reports: request.reports }, { status: 200 });
  } catch (err) {
    logger.error("[POST_/api/requests/[id]/report]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
