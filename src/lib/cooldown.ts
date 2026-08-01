/**
 * @file cooldown.ts
 * @description Standalone 56-day blood donation cooldown rule helper.
 */

export const DONATION_COOLDOWN_DAYS = 56;

export interface CooldownCheckResult {
  eligible: boolean;
  daysRemaining: number;
}

/**
 * Checks whether a donor is eligible to donate blood based on their last donation date.
 * Enforces the standard 56-day (8-week) minimum interval between blood donations.
 *
 * @param lastDonatedAt The date when the donor last donated blood (or null/undefined if never)
 * @param referenceDate The reference point to measure against (defaults to Current Time)
 */
export function isDonorEligibleByCooldown(
  lastDonatedAt?: Date | string | null,
  referenceDate: Date = new Date()
): CooldownCheckResult {
  if (!lastDonatedAt) {
    return { eligible: true, daysRemaining: 0 };
  }

  const lastDonatedDate = typeof lastDonatedAt === "string" ? new Date(lastDonatedAt) : lastDonatedAt;
  
  if (isNaN(lastDonatedDate.getTime())) {
    return { eligible: true, daysRemaining: 0 };
  }

  const diffMs = referenceDate.getTime() - lastDonatedDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays >= DONATION_COOLDOWN_DAYS) {
    return { eligible: true, daysRemaining: 0 };
  }

  const daysRemaining = DONATION_COOLDOWN_DAYS - diffDays;
  return {
    eligible: false,
    daysRemaining: Math.max(1, daysRemaining),
  };
}
