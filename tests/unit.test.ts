import { expect, test, describe } from "bun:test";
import { findEligibleDonors, CandidateDonor } from "../src/lib/matching-engine";
import { isDonorEligibleByCooldown } from "../src/lib/cooldown";

describe("Cooldown Logic (isDonorEligibleByCooldown)", () => {
  test("returns eligible when donor has never donated", () => {
    const res = isDonorEligibleByCooldown(null);
    expect(res.eligible).toBe(true);
    expect(res.daysRemaining).toBe(0);
  });

  test("returns ineligible when donor donated 30 days ago (< 56 days)", () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const res = isDonorEligibleByCooldown(thirtyDaysAgo);
    expect(res.eligible).toBe(false);
    expect(res.daysRemaining).toBeGreaterThan(0);
  });

  test("returns eligible when donor donated 60 days ago (> 56 days)", () => {
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const res = isDonorEligibleByCooldown(sixtyDaysAgo);
    expect(res.eligible).toBe(true);
    expect(res.daysRemaining).toBe(0);
  });
});

describe("Matching Engine (findEligibleDonors)", () => {
  const candidates: CandidateDonor[] = [
    {
      _id: "donor-1",
      name: "Exact Match Donor",
      bloodType: "B+",
      city: "Karachi",
      role: "donor",
      isAvailable: true,
      lastDonatedAt: null,
    },
    {
      _id: "donor-2",
      name: "Universal Donor O-",
      bloodType: "O-",
      city: "Karachi",
      role: "donor",
      isAvailable: true,
      lastDonatedAt: null,
    },
    {
      _id: "donor-3",
      name: "Incompatible Donor AB+",
      bloodType: "AB+",
      city: "Karachi",
      role: "donor",
      isAvailable: true,
      lastDonatedAt: null,
    },
    {
      _id: "donor-4",
      name: "Different City Donor",
      bloodType: "B+",
      city: "Lahore",
      role: "donor",
      isAvailable: true,
      lastDonatedAt: null,
    },
  ];

  test("ranks exact blood type match higher than compatible match for B+ recipient", () => {
    const results = findEligibleDonors(
      { _id: "req-1", bloodType: "B+", city: "Karachi" },
      candidates
    );

    // Should include donor-1 (B+) and donor-2 (O-), exclude donor-3 (AB+ incompatible) and donor-4 (Lahore)
    expect(results.length).toBe(2);
    expect(results[0].donor._id).toBe("donor-1");
    expect(results[0].rank).toBe(1);
    expect(results[0].isExactMatch).toBe(true);

    expect(results[1].donor._id).toBe("donor-2");
    expect(results[1].rank).toBe(2);
    expect(results[1].isExactMatch).toBe(false);
  });

  test("returns empty list when zero candidates match city or compatibility", () => {
    const results = findEligibleDonors(
      { _id: "req-2", bloodType: "AB-", city: "Quetta" },
      candidates
    );
    expect(results.length).toBe(0);
  });
});
