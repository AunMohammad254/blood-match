/**
 * @route POST /api/admin/logs/report
 * @description Generates AI error report or raw Markdown/CSV exports for system error logs
 * @access Admin only
 */
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { ErrorLog } from "@/lib/models/ErrorLog";
import { requireAdmin } from "@/lib/middleware/auth";
import { logger } from "@/lib/logger";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request): Promise<Response> {
  try {
    const admin = requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden. Admin access only." }, { status: 403 });
    }

    await connectDB();
    const body = await req.json().catch(() => ({}));
    const { format = "markdown", hours = 24, forceRaw = false } = body;

    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    const logs = await ErrorLog.find({ timestamp: { $gte: cutoffDate } })
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();

    if (logs.length === 0) {
      return NextResponse.json({
        report: `# System Error Report (${hours}h Window)\n\nNo error log entries recorded during this time window.`,
        isAiGenerated: false,
        totalEntries: 0,
      });
    }

    // Deterministic Markdown format helper
    const generateRawMarkdown = () => {
      let md = `# System Error Report (Past ${hours} Hours)\n\n`;
      md += `**Total Entries Logged:** ${logs.length}\n`;
      md += `**Generated At:** ${new Date().toISOString()}\n\n`;
      md += `| Timestamp | Severity | Route | Message |\n`;
      md += `|---|---|---|---|\n`;

      for (const log of logs) {
        const timeStr = new Date(log.timestamp).toLocaleTimeString();
        const msgClean = (log.message || "").replace(/\|/g, "\\|").replace(/\n/g, " ");
        md += `| ${timeStr} | \`${log.severity}\` | \`${log.route}\` | ${msgClean} |\n`;
      }
      return md;
    };

    // Deterministic CSV format helper
    const generateRawCSV = () => {
      let csv = `"Timestamp","Severity","Route","Message","UserRole"\n`;
      for (const log of logs) {
        const timeStr = new Date(log.timestamp).toISOString();
        const msgEscaped = (log.message || "").replace(/"/g, '""');
        csv += `"${timeStr}","${log.severity}","${log.route}","${msgEscaped}","${log.userRole || "unauthenticated"}"\n`;
      }
      return csv;
    };

    if (format === "csv") {
      return new Response(generateRawCSV(), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="error-report-${Date.now()}.csv"`,
        },
      });
    }

    if (forceRaw) {
      return NextResponse.json({
        report: generateRawMarkdown(),
        isAiGenerated: false,
        totalEntries: logs.length,
      });
    }

    // Attempt Gemini AI summarization if API key exists
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        report: generateRawMarkdown(),
        isAiGenerated: false,
        totalEntries: logs.length,
        notice: "AI service unconfigured; fallback raw log report generated.",
      });
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const logSnippets = logs
        .slice(0, 30)
        .map(l => `[${new Date(l.timestamp).toISOString()}] [${l.severity}] Route: ${l.route} - ${l.message}`)
        .join("\n");

      const prompt = `Analyze and summarize the following system error log entries into a clean Markdown incident report.
Group by root causes and recommend resolution steps.

Logs (${logs.length} total entries):
${logSnippets}`;

      const aiResponse = await model.generateContent(prompt);
      const reportMarkdown = aiResponse.response.text();

      return NextResponse.json({
        report: reportMarkdown,
        isAiGenerated: true,
        totalEntries: logs.length,
      });
    } catch (aiErr: any) {
      logger.error("[POST /api/admin/logs/report AI failure]", aiErr);
      return NextResponse.json({
        report: generateRawMarkdown(),
        isAiGenerated: false,
        totalEntries: logs.length,
        notice: "AI report generation failed — raw log report returned. Click Retry or export CSV.",
      });
    }
  } catch (err: any) {
    logger.error("[POST /api/admin/logs/report]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
