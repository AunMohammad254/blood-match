/**
 * @route POST /api/ai/detect-duplicate
 * @description AI-assisted duplicate blood request detection endpoint
 * @access Authenticated
 */
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/middleware/auth";
import { detectDuplicateRequest } from "@/lib/duplicate-detector";
import { analyzeAiDuplicateDetection } from "@/lib/ai/gemini";
import { logger } from "@/lib/logger";

export async function POST(req: Request): Promise<Response> {
  try {
    const user = verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const { patientName, hospital, city, bloodType, excludeRequestId } = body;

    if (!patientName || !hospital || !city || !bloodType) {
      return NextResponse.json(
        { error: "Missing required fields (patientName, hospital, city, bloodType)." },
        { status: 400 }
      );
    }

    // Step 1: Perform heuristic pre-scan
    const heuristicResult = await detectDuplicateRequest({
      patientName,
      hospital,
      city,
      bloodType,
      excludeRequestId,
    });

    // Step 2: Layer AI analysis on top of heuristic pre-scan
    const aiResult = await analyzeAiDuplicateDetection({
      patientName,
      hospital,
      city,
      bloodType,
      heuristicResult,
    });

    return NextResponse.json(aiResult, { status: 200 });
  } catch (error) {
    const err = error instanceof Error ? error : new Error("Unknown error");
    logger.error("[POST /api/ai/detect-duplicate]", { error: err.message });
    return NextResponse.json(
      {
        isDuplicate: false,
        confidence: 0,
        reasoning: "Server error during duplicate detection scan.",
        matchedRequestIds: [],
        isAiAssisted: false,
      },
      { status: 200 }
    );
  }
}
