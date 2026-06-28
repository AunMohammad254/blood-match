/**
 * @route ${routePath}
 * @description API Endpoint Handler
 * @access Internal/Authenticated
 */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { BloodRequest } from "@/lib/models/BloodRequest";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
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
            sendEvent({ type: "new_requests", requests: newRequests });
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
