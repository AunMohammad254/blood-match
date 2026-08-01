/**
 * @route ${routePath}
 * @description API Endpoint Handler
 * @access Internal/Authenticated
 */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { BloodRequest } from "@/lib/models/BloodRequest";
import { logger } from "@/lib/logger";

import { verifyAuth } from "@/lib/middleware/auth";

export const dynamic = "force-dynamic";

function maskPatientName(name: string): string {
  if (!name) return "Patient";
  const parts = name.trim().split(/\s+/);
  return parts.map((p) => `${p.charAt(0)}***`).join(" ");
}

export async function GET(req: Request): Promise<Response> {
  const user = verifyAuth(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized. Live updates require authentication." }, { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let lastChecked = new Date();

      const sendEvent = (data: any) => {
        const payload = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      // Send initial connection verification event
      sendEvent({ type: "connected" });

      const interval = setInterval(async () => {
        try {
          await connectDB();
          
          // Poll for open requests created after our last check
          const newRequests = await BloodRequest.find({
            status: "open",
            isVerified: true,
            createdAt: { $gt: lastChecked },
          })
            .select("patientName bloodType city hospital urgency createdAt")
            .lean();

          if (newRequests && newRequests.length > 0) {
            const maskedRequests = newRequests.map((r: any) => ({
              ...r,
              patientName: maskPatientName(r.patientName),
            }));
            sendEvent({ type: "new_requests", requests: maskedRequests });
            lastChecked = new Date();
          } else {
            sendEvent({ type: "ping" });
          }
        } catch (err: any) {
          logger.error("SSE interval error:", err);
          sendEvent({ type: "error", message: "Database query failed" });
        }
      }, 10000); // Check every 10 seconds

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}
