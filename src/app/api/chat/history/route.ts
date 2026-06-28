/**
 * @route ${routePath}
 * @description API Endpoint Handler
 * @access Internal/Authenticated
 */
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { verifyAuth } from "@/lib/middleware/auth";
import { ChatHistory } from "@/lib/models/ChatHistory";
import { logger } from "@/lib/logger";

export async function GET(req: Request): Promise<Response> {
  try {
    await connectDB();
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("id");

    if (sessionId) {
      // Fetch details of a specific session - using .lean() for faster, read-only performance
      const session = await ChatHistory.findOne({ _id: sessionId, userId: decoded.userId }).lean();
      if (!session) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }
      return NextResponse.json({ session });
    }

    // Retrieve list of up to 5 chat histories sorted by last updated - optimized with .lean()
    const histories = await ChatHistory.find({ userId: decoded.userId })
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean();

    return NextResponse.json({ histories });
  } catch (err: any) {
    logger.error("[GET /api/chat/history]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request): Promise<Response> {
  try {
    await connectDB();
    const decoded = verifyAuth(req);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("id");

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    const deleteResult = await ChatHistory.deleteOne({ _id: sessionId, userId: decoded.userId });
    if (deleteResult.deletedCount === 0) {
      return NextResponse.json({ error: "Session not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    logger.error("[DELETE /api/chat/history]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
