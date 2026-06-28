import { BloodType, COMPATIBILITY_MAP } from "@/lib/constants";

/**
 * Given a recipient's blood type,
 * returns all donor blood types that are compatible.
 */
export function getCompatibleDonorTypes(recipientType: BloodType): BloodType[] {
  const compatibleDonors: BloodType[] = [];

  for (const [donorType, canDonateTo] of Object.entries(COMPATIBILITY_MAP)) {
    if ((canDonateTo as BloodType[]).includes(recipientType)) {
      compatibleDonors.push(donorType as BloodType);
    }
  }

  return compatibleDonors;
}
