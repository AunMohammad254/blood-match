/**
 * @route ${routePath}
 * @description API Endpoint Handler
 * @access Internal/Authenticated
 */
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { ChatHistory } from "@/lib/models/ChatHistory";
import { requireAdmin } from "@/lib/middleware/auth";
import { logger } from "@/lib/logger";

export async function DELETE(req: Request, { params }: { params: { id: string } }): Promise<NextResponse> {
  try {
    const admin = requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden. Admin access only." }, { status: 403 });
    }

    await connectDB();
    const { id } = params;

    const res = await ChatHistory.deleteOne({ _id: id });
    if (res.deletedCount === 0) {
      return NextResponse.json({ error: "Chat log not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Chat log deleted successfully." });
  } catch (err) {
    logger.error("[DELETE /api/admin/chats/[id]]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
