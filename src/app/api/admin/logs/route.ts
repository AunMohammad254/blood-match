/**
 * @route GET /api/admin/logs
 * @description API route handler for GET /api/admin/logs
 * @access Authenticated
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

    const type = searchParams.get("type");
    const severity = searchParams.get("severity");

    if (type === "error" || severity) {
      const { ErrorLog } = await import("@/lib/models/ErrorLog");
      const errorFilter: Record<string, any> = {};
      if (severity) errorFilter.severity = severity;
      if (search && search.trim()) {
        const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        errorFilter.$or = [
          { route: { $regex: escaped, $options: "i" } },
          { message: { $regex: escaped, $options: "i" } },
        ];
      }

      const [errorLogs, total] = await Promise.all([
        ErrorLog.find(errorFilter)
          .sort({ timestamp: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        ErrorLog.countDocuments(errorFilter),
      ]);

      return NextResponse.json({ logs: errorLogs, total, page, limit });
    }

    const filter: Record<string, any> = {};
    if (search && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { ip: { $regex: escaped, $options: "i" } },
        { modelName: { $regex: escaped, $options: "i" } },
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
