/**
 * @file matching-engine.ts
 * @description Pure deterministic blood matching engine.
 */

import { BloodType, COMPATIBILITY_MAP } from "@/lib/constants";
import { isDonorEligibleByCooldown } from "@/lib/cooldown";

export interface CandidateDonor {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  bloodType: BloodType;
  city: string;
  role: string;
  isAvailable: boolean;
  isEmailVerified?: boolean;
  lastDonatedAt?: Date | string | null;
  location?: {
    type: string;
    coordinates: [number, number];
  };
}

export interface MatchingRequestInput {
  _id: string;
  bloodType: BloodType;
  city: string;
  hospital?: string;
  urgency?: string;
}

export interface MatchedDonorResult {
  donor: CandidateDonor;
  score: number;
  rank: number;
  isExactMatch: boolean;
  cooldownDaysRemaining: number;
}

/**
 * Evaluates and ranks candidate donors against an emergency blood request.
 * Pure deterministic function with zero side effects.
 *
 * Rules Applied:
 * 1. Role: Must be an active "donor".
 * 2. Availability: Must have `isAvailable: true`.
 * 3. City: Must be in the same city as the request.
 * 4. Blood Compatibility: `COMPATIBILITY_MAP[request.bloodType]` must include candidate's `bloodType`.
 * 5. 56-Day Cooldown: Candidate must pass `isDonorEligibleByCooldown`.
 */
export function findEligibleDonors(
  request: MatchingRequestInput,
  candidateDonors: CandidateDonor[],
  referenceDate: Date = new Date()
): MatchedDonorResult[] {
  const compatibleDonorTypes = COMPATIBILITY_MAP[request.bloodType] || [];

  const eligible: MatchedDonorResult[] = [];

  for (const donor of candidateDonors) {
    // 1. Role check (must be donor)
    if (donor.role !== "donor") continue;

    // 2. Active availability check
    if (!donor.isAvailable) continue;

    // 3. City match
    if (donor.city.trim().toLowerCase() !== request.city.trim().toLowerCase()) continue;

    // 4. ABO Compatibility check (Reverse lookup: request recipient bloodType needs donor bloodType)
    // COMPATIBILITY_MAP maps Donor Blood Type -> Recipient Types it can donate to.
    // So candidate donor.bloodType can donate to request.bloodType if COMPATIBILITY_MAP[donor.bloodType].includes(request.bloodType).
    const donorCanDonateTo = COMPATIBILITY_MAP[donor.bloodType] || [];
    if (!donorCanDonateTo.includes(request.bloodType)) continue;

    // 5. 56-day Cooldown check
    const cooldown = isDonorEligibleByCooldown(donor.lastDonatedAt, referenceDate);
    if (!cooldown.eligible) continue;

    // Scoring calculation
    const isExactMatch = donor.bloodType === request.bloodType;
    let score = isExactMatch ? 100 : 70;

    // Recency bonus: reward donors who haven't donated recently or ever
    if (!donor.lastDonatedAt) {
      score += 20; // Never donated = top readiness
    } else {
      const daysSinceDonation = Math.floor(
        (referenceDate.getTime() - new Date(donor.lastDonatedAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      score += Math.min(20, Math.floor(daysSinceDonation / 10));
    }

    eligible.push({
      donor,
      score,
      rank: 0, // Assigned after sorting
      isExactMatch,
      cooldownDaysRemaining: cooldown.daysRemaining,
    });
  }

  // Sort by score descending (higher score = better rank)
  eligible.sort((a, b) => b.score - a.score);

  // Assign 1-indexed ranks
  return eligible.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}
