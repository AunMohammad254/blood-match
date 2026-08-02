/**
 * @route POST /api/ai/classify-urgency
 * @description AI-assisted blood request urgency classification endpoint
 * @access Authenticated
 */
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/middleware/auth";
import { classifyRequestUrgency } from "@/lib/ai/gemini";
import { logger } from "@/lib/logger";

export async function POST(req: Request): Promise<Response> {
  try {
    const user = verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const { patientName, hospital, city, bloodType, units, notes } = body;

    if (!patientName || !hospital || !city || !bloodType || typeof units !== "number") {
      return NextResponse.json(
        { error: "Missing required fields (patientName, hospital, city, bloodType, units)." },
        { status: 400 }
      );
    }

    const classification = await classifyRequestUrgency({
      patientName,
      hospital,
      city,
      bloodType,
      units,
      notes,
    });

    return NextResponse.json(classification, { status: 200 });
  } catch (error) {
    const err = error instanceof Error ? error : new Error("Unknown error");
    logger.error("[POST /api/ai/classify-urgency]", { error: err.message });
    return NextResponse.json(
      {
        urgency: "normal",
        confidence: 0,
        reasoning: "Server error during classification.",
        isAiAssisted: false,
      },
      { status: 200 }
    );
  }
}
