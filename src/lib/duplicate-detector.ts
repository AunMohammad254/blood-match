/**
 * @file duplicate-detector.ts
 * @description Pure heuristic duplicate request detection module for BloodMatch.
 */

import mongoose from "mongoose";
import { BloodRequest } from "@/lib/models/BloodRequest";

export interface RequestDuplicateInput {
  patientName: string;
  hospital: string;
  city: string;
  bloodType: string;
  windowHours?: number;
  excludeRequestId?: string;
}

export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  duplicateCount: number;
  reason?: string;
  matchedRequestIds: string[];
}

/**
 * Checks database for potential duplicate requests submitted within the specified time window.
 * Matches on:
 * 1. Exact case-insensitive match on patient name + hospital + city.
 * 2. OR matching hospital + city + bloodType within time window.
 */
export async function detectDuplicateRequest(
  input: RequestDuplicateInput
): Promise<DuplicateDetectionResult> {
  const windowHours = input.windowHours ?? 24;
  const cutoffDate = new Date(Date.now() - windowHours * 60 * 60 * 1000);

  const normalizedPatient = input.patientName.trim().toLowerCase();
  const normalizedHospital = input.hospital.trim().toLowerCase();
  const normalizedCity = input.city.trim().toLowerCase();

  const query: any = {
    createdAt: { $gte: cutoffDate },
    status: { $nin: ["rejected", "cancelled", "expired", "fulfilled"] },
  };

  if (input.excludeRequestId && mongoose.Types.ObjectId.isValid(input.excludeRequestId)) {
    query._id = { $ne: input.excludeRequestId };
  }

  const recentRequests = await BloodRequest.find(query).lean();

  const matchedIds: string[] = [];
  let nameAndHospitalMatches = 0;
  let hospitalAndBloodMatches = 0;

  for (const req of recentRequests) {
    const reqPatient = (req.patientName || "").trim().toLowerCase();
    const reqHospital = (req.hospital || "").trim().toLowerCase();
    const reqCity = (req.city || "").trim().toLowerCase();
    const reqBloodType = req.bloodType;

    const isSamePatient = reqPatient === normalizedPatient;
    const isSameHospital = reqHospital === normalizedHospital && reqCity === normalizedCity;
    const isSameBloodType = reqBloodType === input.bloodType;

    if (isSamePatient && isSameHospital) {
      nameAndHospitalMatches++;
      matchedIds.push(req._id.toString());
    } else if (isSameHospital && isSameBloodType) {
      hospitalAndBloodMatches++;
      matchedIds.push(req._id.toString());
    }
  }

  const totalMatches = matchedIds.length;
  const isDuplicate = totalMatches > 0;

  let reason: string | undefined;
  if (nameAndHospitalMatches > 0) {
    reason = `Potential duplicate: ${nameAndHospitalMatches} recent request(s) found for '${input.patientName}' at ${input.hospital} in past ${windowHours}h.`;
  } else if (hospitalAndBloodMatches > 0) {
    reason = `Potential duplicate: ${hospitalAndBloodMatches} recent request(s) found at ${input.hospital} for ${input.bloodType} blood in past ${windowHours}h.`;
  }

  return {
    isDuplicate,
    duplicateCount: totalMatches,
    reason,
    matchedRequestIds: matchedIds,
  };
}
