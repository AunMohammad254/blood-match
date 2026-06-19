export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { ChatHistory } from "@/lib/models/ChatHistory";
import { requireAdmin } from "@/lib/middleware/auth";

export async function GET(req: Request) {
  try {
    const admin = requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden. Admin access only." }, { status: 403 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "20"));

    const [chats, total] = await Promise.all([
      ChatHistory.find({})
        .populate("userId", "name email")
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ChatHistory.countDocuments({}),
    ]);

    return NextResponse.json({ chats, total, page, limit });
  } catch (err) {
    console.error("[GET /api/admin/chats]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
