/**
 * @route ${routePath}
 * @description API Endpoint Handler
 * @access Internal/Authenticated
 */
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { ChatRequestLog } from "@/lib/models/ChatRequestLog";
import { requireAdmin } from "@/lib/middleware/auth";
import { logger } from "@/lib/logger";

export async function GET(req: Request): Promise<Response> {
  try {
    const admin = requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden. Admin access only." }, { status: 403 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "20"));

    const filter: Record<string, any> = {};
    if (search && search.trim()) {
      filter.$or = [
        { ip: { $regex: search, $options: "i" } },
        { modelName: { $regex: search, $options: "i" } },
      ];
    }

    const [logs, total] = await Promise.all([
      ChatRequestLog.find(filter)
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ChatRequestLog.countDocuments(filter),
    ]);

    return NextResponse.json({ logs, total, page, limit });
  } catch (err: any) {
    logger.error("[GET /api/admin/logs]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
