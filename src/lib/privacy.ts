/**
 * @file privacy.ts
 * @description Query projections and pure allowlist sanitizers enforcing the
 * BloodMatch consent gate (Rules.md §5): donor PII (phone/email) and sensitive
 * credentials (password hashes, OTPs) must never leak in API responses prior
 * to an explicit Consent record for the (donor, request) pair.
 */

import type { BloodType } from "@/lib/constants";
import type { MatchedDonorResult } from "@/lib/matching-engine";

/**
 * Explicit Mongoose `.select()` allowlist for candidate donor matching queries.
 * Never selects password, phone, email, or OTP fields.
 */
export const SAFE_DONOR_PROJECTION =
  "_id name bloodType city role isAvailable isEmailVerified lastDonatedAt location";

/**
 * Explicit Mongoose `.select()` allowlist for general donor directory & search
 * endpoints (/api/donors, /api/match) where no donor+request Consent exists.
 */
export const SAFE_DONOR_DIRECTORY_PROJECTION =
  "_id name bloodType city isAvailable isEmailVerified lastDonatedAt createdAt";

export interface ConsentedDonorContact {
  phone?: string;
  email?: string;
}

export interface SanitizedMatchDonor {
  _id: string;
  name: string;
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
  phone?: string;
  email?: string;
}

export interface SanitizedMatchedDonorResult
  extends Omit<MatchedDonorResult, "donor"> {
  donor: SanitizedMatchDonor;
  hasConsent: boolean;
}

export interface SanitizedDirectoryDonor {
  _id: string;
  name: string;
  bloodType: BloodType | string;
  city: string;
  isAvailable: boolean;
  isEmailVerified?: boolean;
  lastDonatedAt?: Date | string | null;
  createdAt?: Date | string;
  matchScore?: number;
}

function normalizeId(rawId: unknown): string {
  if (rawId && typeof (rawId as { toString?: () => string }).toString === "function") {
    return (rawId as { toString: () => string }).toString();
  }
  return String(rawId ?? "");
}

/**
 * Strictly allowlists safe donor fields for matching responses.
 * Contact info (`phone`, `email`) is attached ONLY when `consentedContact` is
 * supplied (backed by a verified Consent document for that donor+request pair).
 */
export function sanitizeDonorForMatch(
  donor: Record<string, any>,
  consentedContact: ConsentedDonorContact | null = null
): SanitizedMatchDonor {
  const sanitized: SanitizedMatchDonor = {
    _id: normalizeId(donor._id),
    name: donor.name,
    bloodType: donor.bloodType,
    city: donor.city,
    role: donor.role,
    isAvailable: Boolean(donor.isAvailable),
  };

  if (donor.isEmailVerified !== undefined) {
    sanitized.isEmailVerified = Boolean(donor.isEmailVerified);
  }
  if (donor.lastDonatedAt !== undefined) {
    sanitized.lastDonatedAt = donor.lastDonatedAt;
  }
  if (donor.location !== undefined) {
    sanitized.location = donor.location;
  }

  if (consentedContact) {
    if (consentedContact.phone !== undefined) {
      sanitized.phone = consentedContact.phone;
    }
    if (consentedContact.email !== undefined) {
      sanitized.email = consentedContact.email;
    }
  }

  return sanitized;
}

/**
 * Sanitizes an array of matching engine results, attaching `hasConsent` and
 * stripping all non-allowlisted donor fields unless explicit Consent exists.
 */
export function sanitizeMatchResults(
  matches: MatchedDonorResult[],
  consentedContactByDonorId?: ReadonlyMap<string, ConsentedDonorContact>
): SanitizedMatchedDonorResult[] {
  return matches.map((match) => {
    const donorId = normalizeId(match.donor?._id);
    const consentedContact = consentedContactByDonorId?.get(donorId) ?? null;

    return {
      score: match.score,
      rank: match.rank,
      isExactMatch: match.isExactMatch,
      cooldownDaysRemaining: match.cooldownDaysRemaining,
      hasConsent: consentedContact !== null,
      donor: sanitizeDonorForMatch(
        match.donor as unknown as Record<string, any>,
        consentedContact
      ),
    };
  });
}

/**
 * Strictly allowlists safe donor fields for general directory/search responses
 * (/api/donors, /api/match) where no per-request Consent record exists.
 */
export function sanitizeDonorForDirectory(
  donor: Record<string, any>
): SanitizedDirectoryDonor {
  const sanitized: SanitizedDirectoryDonor = {
    _id: normalizeId(donor._id),
    name: donor.name,
    bloodType: donor.bloodType,
    city: donor.city,
    isAvailable: Boolean(donor.isAvailable),
  };

  if (donor.isEmailVerified !== undefined) {
    sanitized.isEmailVerified = Boolean(donor.isEmailVerified);
  }
  if (donor.lastDonatedAt !== undefined) {
    sanitized.lastDonatedAt = donor.lastDonatedAt;
  }
  if (donor.createdAt !== undefined) {
    sanitized.createdAt = donor.createdAt;
  }
  if (donor.matchScore !== undefined) {
    sanitized.matchScore = donor.matchScore;
  }

  return sanitized;
}
