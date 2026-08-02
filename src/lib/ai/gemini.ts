/**
 * @file gemini.ts
 * @description Centralized Gemini AI client integration module for BloodMatch.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "@/lib/logger";

const apiKey = process.env.GEMINI_API_KEY || "";

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export interface UrgencyClassificationResult {
  urgency: "normal" | "urgent" | "critical";
  confidence: number;
  reasoning: string;
  isAiAssisted: boolean;
}

/**
 * Classifies the urgency of a blood request using Google Gemini AI.
 * Includes graceful degradation fallback if GEMINI_API_KEY is missing or API fails.
 */
export async function classifyRequestUrgency(input: {
  patientName: string;
  hospital: string;
  city: string;
  bloodType: string;
  units: number;
  notes?: string;
}): Promise<UrgencyClassificationResult> {
  if (!genAI || !apiKey) {
    logger.warn("[AI:gemini] GEMINI_API_KEY is not configured. Falling back to default urgency classification.");
    return {
      urgency: input.units >= 3 ? "urgent" : "normal",
      confidence: 0.5,
      reasoning: "AI service unconfigured; fallback standard heuristic applied.",
      isAiAssisted: false,
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are a medical triage assistant for an emergency blood donation matching system (BloodMatch).
Classify the urgency level of the following blood request as one of: ["normal", "urgent", "critical"].

Request Details:
- Patient Name: ${input.patientName}
- Blood Type: ${input.bloodType}
- Units Requested: ${input.units}
- Hospital: ${input.hospital}
- City: ${input.city}
${input.notes ? `- Clinical Notes: ${input.notes}` : ""}

Return ONLY a valid JSON object matching this exact structure:
{
  "urgency": "normal" | "urgent" | "critical",
  "confidence": <number between 0 and 1>,
  "reasoning": "<brief 1-sentence medical explanation>"
}`;

    const response = await model.generateContent(prompt);
    const responseText = response.response.text().trim();

    // Clean JSON formatting if wrapped in markdown block
    const cleanedJson = responseText.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleanedJson);

    const validUrgency = ["normal", "urgent", "critical"].includes(parsed.urgency)
      ? parsed.urgency
      : input.units >= 3
      ? "urgent"
      : "normal";

    return {
      urgency: validUrgency,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.8,
      reasoning: parsed.reasoning || "AI assessment based on clinical parameters.",
      isAiAssisted: true,
    };
  } catch (err: any) {
    logger.error("[AI:gemini] Error classifying urgency:", { error: err.message });
    return {
      urgency: input.units >= 3 ? "urgent" : "normal",
      confidence: 0.5,
      reasoning: "AI service error; fallback standard heuristic applied.",
      isAiAssisted: false,
    };
  }
}

export interface AiDuplicateAnalysisResult {
  isDuplicate: boolean;
  confidence: number;
  reasoning: string;
  matchedRequestIds: string[];
  isAiAssisted: boolean;
}

/**
 * Analyzes potential request duplication using Gemini AI layered on top of heuristic duplicate detector.
 * Fallback to heuristic result if GEMINI_API_KEY is unconfigured or fails.
 */
export async function analyzeAiDuplicateDetection(input: {
  patientName: string;
  hospital: string;
  city: string;
  bloodType: string;
  heuristicResult: {
    isDuplicate: boolean;
    duplicateCount: number;
    reason?: string;
    matchedRequestIds: string[];
  };
}): Promise<AiDuplicateAnalysisResult> {
  const { heuristicResult } = input;

  if (!genAI || !apiKey) {
    logger.warn("[AI:gemini] GEMINI_API_KEY unconfigured. Falling back to heuristic duplicate result.");
    return {
      isDuplicate: heuristicResult.isDuplicate,
      confidence: heuristicResult.isDuplicate ? 0.9 : 1.0,
      reasoning: heuristicResult.reason || "No potential duplicate requests detected by heuristic scan.",
      matchedRequestIds: heuristicResult.matchedRequestIds,
      isAiAssisted: false,
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are an AI verification assistant for BloodMatch.
Analyze whether the following newly submitted blood request is a duplicate of recent requests.

New Request Parameters:
- Patient Name: ${input.patientName}
- Hospital: ${input.hospital}
- City: ${input.city}
- Blood Type: ${input.bloodType}

Heuristic Pre-Scan Findings:
- Is Duplicate Candidate: ${heuristicResult.isDuplicate}
- Matched Candidates Count: ${heuristicResult.duplicateCount}
- Pre-Scan Summary: ${heuristicResult.reason || "None"}

Return ONLY a valid JSON object matching this exact structure:
{
  "isDuplicate": true | false,
  "confidence": <number between 0 and 1>,
  "reasoning": "<1-sentence explanation summarizing why this is or is not likely a duplicate request>"
}`;

    const response = await model.generateContent(prompt);
    const responseText = response.response.text().trim();

    const cleanedJson = responseText.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleanedJson);

    return {
      isDuplicate: typeof parsed.isDuplicate === "boolean" ? parsed.isDuplicate : heuristicResult.isDuplicate,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.85,
      reasoning: parsed.reasoning || heuristicResult.reason || "AI evaluated candidate similarity.",
      matchedRequestIds: heuristicResult.matchedRequestIds,
      isAiAssisted: true,
    };
  } catch (err: any) {
    logger.error("[AI:gemini] Error analyzing duplicate detection:", { error: err.message });
    return {
      isDuplicate: heuristicResult.isDuplicate,
      confidence: heuristicResult.isDuplicate ? 0.9 : 1.0,
      reasoning: heuristicResult.reason || "No duplicate requests detected by heuristic scan (AI fallback).",
      matchedRequestIds: heuristicResult.matchedRequestIds,
      isAiAssisted: false,
    };
  }
}

