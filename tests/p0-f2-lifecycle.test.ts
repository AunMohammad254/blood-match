import { expect, test, describe, beforeEach, afterEach } from "bun:test";
import { UserSchema } from "../src/lib/models/User";
import { BloodRequestSchema } from "../src/lib/models/BloodRequest";
import { DonationRecordSchema } from "../src/lib/models/DonationRecord";
import {
  EXPIRABLE_STATUSES,
  TERMINAL_OR_COMPLETED_STATUSES,
  ALLOWED_TRANSITIONS,
  isRequestExpired,
  buildActiveExpiryFilter,
  expireStaleRequests,
  isValidStatusTransition,
  isStatusRollback,
  determineStatusAuditAction,
  recordDonationFulfillment,
  applyRequestStatusTransition,
} from "../src/lib/expiration";
import {
  memoryDatabase,
  initialUsers,
  initialRequests,
  UserMemoryModel,
  BloodRequestMemoryModel,
  DonationRecordMemoryModel,
  AuditLogMemoryModel,
  MockBloodRequest,
} from "../src/lib/db/memoryStore";
import { isDonorEligibleByCooldown } from "../src/lib/cooldown";
import { findEligibleDonors } from "../src/lib/matching-engine";

// Helper to reset the in-memory store between tests for complete isolation
function resetMemoryDatabase() {
  memoryDatabase.users = initialUsers.map((u) => ({ ...u }));
  memoryDatabase.bloodRequests = initialRequests.map((r) => ({ ...r, declinedBy: [...(r.declinedBy || [])] }));
  memoryDatabase.donationRecords = [];
  (memoryDatabase as any).auditLogs = [];
}

describe("1. Schema Index Safety (Zero Destructive MongoDB TTL Indexes)", () => {
  test("UserSchema has NO TTL (expireAfterSeconds) index that could delete User documents", () => {
    const indexes = UserSchema.indexes();
    const ttlIndexes = indexes.filter(([, options]) => options && "expireAfterSeconds" in options);
    expect(ttlIndexes).toHaveLength(0);

    // Explicitly verify emailVerificationOtpExpiry has no TTL index
    const otpTtlIndex = indexes.find(
      ([fields, options]) =>
        "emailVerificationOtpExpiry" in fields && options && options.expireAfterSeconds !== undefined
    );
    expect(otpTtlIndex).toBeUndefined();
  });

  test("BloodRequestSchema has NO TTL (expireAfterSeconds) index and uses non-TTL { status: 1, expiresAt: 1 } index", () => {
    const indexes = BloodRequestSchema.indexes();
    const ttlIndexes = indexes.filter(([, options]) => options && "expireAfterSeconds" in options);
    expect(ttlIndexes).toHaveLength(0);

    const statusExpiresIdx = indexes.find(
      ([fields]) => fields.status === 1 && fields.expiresAt === 1
    );
    expect(statusExpiresIdx).toBeDefined();
    expect(statusExpiresIdx?.[1]?.expireAfterSeconds).toBeUndefined();
  });

  test("DonationRecordSchema has NO TTL index and enforces sparse unique requestId index for idempotency", () => {
    const indexes = DonationRecordSchema.indexes();
    const ttlIndexes = indexes.filter(([, options]) => options && "expireAfterSeconds" in options);
    expect(ttlIndexes).toHaveLength(0);

    const reqIdIdx = indexes.find(([fields]) => fields.requestId === 1);
    expect(reqIdIdx).toBeDefined();
    expect(reqIdIdx?.[1]?.unique).toBe(true);
    expect(reqIdIdx?.[1]?.sparse).toBe(true);
  });
});

describe("2. Pure Expiration Helpers (isRequestExpired & buildActiveExpiryFilter)", () => {
  const now = new Date("2026-11-19T12:00:00.000Z");
  const past = new Date("2026-11-19T10:00:00.000Z");
  const future = new Date("2026-11-20T12:00:00.000Z");

  test("returns true for every expirable status when expiresAt <= referenceDate", () => {
    for (const status of EXPIRABLE_STATUSES) {
      expect(isRequestExpired({ status, expiresAt: past }, now)).toBe(true);
      expect(isRequestExpired({ status, expiresAt: now }, now)).toBe(true);
      expect(isRequestExpired({ status, expiresAt: past.toISOString() }, now)).toBe(true);
    }
  });

  test("returns false for every expirable status when expiresAt > referenceDate", () => {
    for (const status of EXPIRABLE_STATUSES) {
      expect(isRequestExpired({ status, expiresAt: future }, now)).toBe(false);
    }
  });

  test("returns false for all terminal/completed statuses even if expiresAt is in the past", () => {
    for (const status of TERMINAL_OR_COMPLETED_STATUSES) {
      expect(isRequestExpired({ status, expiresAt: past }, now)).toBe(false);
    }
  });

  test("handles missing/null expiresAt cleanly including legacy 3-day rule for open requests", () => {
    const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

    // Non-open active requests without expiresAt do not auto-expire
    expect(isRequestExpired({ status: "verified", expiresAt: null, createdAt: fourDaysAgo }, now)).toBe(false);
    expect(isRequestExpired({ status: "committed", expiresAt: undefined, createdAt: fourDaysAgo }, now)).toBe(false);

    // Legacy open requests without expiresAt expire after 3 days
    expect(isRequestExpired({ status: "open", expiresAt: null, createdAt: fourDaysAgo }, now)).toBe(true);
    expect(isRequestExpired({ status: "open", expiresAt: null, createdAt: oneDayAgo }, now)).toBe(false);
    expect(isRequestExpired({ status: "open", expiresAt: null, createdAt: null }, now)).toBe(false);
  });

  test("buildActiveExpiryFilter returns defense-in-depth filter for active statuses and null for terminal statuses", () => {
    for (const status of EXPIRABLE_STATUSES) {
      const clause = buildActiveExpiryFilter(status, now);
      expect(clause).not.toBeNull();
      expect(Array.isArray((clause as any).$or)).toBe(true);
    }

    for (const status of TERMINAL_OR_COMPLETED_STATUSES) {
      expect(buildActiveExpiryFilter(status, now)).toBeNull();
    }
  });
});

describe("3. Soft Expiration Engine (expireStaleRequests)", () => {
  beforeEach(() => resetMemoryDatabase());
  afterEach(() => resetMemoryDatabase());

  test("transitions overdue active requests to 'expired', unsets expiresAt, never deletes documents, and preserves completed/future requests", async () => {
    const now = new Date("2026-11-19T12:00:00.000Z");
    const pastIso = new Date("2026-11-18T12:00:00.000Z").toISOString();
    const futureIso = new Date("2026-11-21T12:00:00.000Z").toISOString();
    const fourDaysAgoIso = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString();
    const oneDayAgoIso = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString();

    const baseReq = {
      patientName: "Test Patient",
      bloodType: "O+",
      units: 1,
      hospital: "Aga Khan Hospital",
      city: "Karachi",
      urgency: "urgent" as const,
      contactPhone: "03001234567",
      requestedBy: "usr_recipient_1",
      isVerified: true,
      declinedBy: [],
      createdAt: oneDayAgoIso,
      updatedAt: oneDayAgoIso,
    };

    const seedRequests: MockBloodRequest[] = [
      // Overdue active requests (should become expired with expiresAt unset)
      { ...baseReq, _id: "exp_pending", status: "pending", isVerified: false, expiresAt: pastIso },
      { ...baseReq, _id: "exp_open", status: "open", expiresAt: pastIso },
      { ...baseReq, _id: "exp_verified", status: "verified", expiresAt: pastIso },
      { ...baseReq, _id: "exp_matched", status: "matched", expiresAt: pastIso },
      { ...baseReq, _id: "exp_contacted", status: "contacted", expiresAt: pastIso },
      { ...baseReq, _id: "exp_committed", status: "committed", expiresAt: pastIso },
      { ...baseReq, _id: "exp_legacy_open", status: "open", expiresAt: undefined, createdAt: fourDaysAgoIso },

      // Requests that MUST remain untouched
      { ...baseReq, _id: "keep_future_verified", status: "verified", expiresAt: futureIso },
      { ...baseReq, _id: "keep_fresh_legacy_open", status: "open", expiresAt: undefined, createdAt: oneDayAgoIso },
      { ...baseReq, _id: "keep_fulfilled", status: "fulfilled", expiresAt: pastIso },
      { ...baseReq, _id: "keep_donated", status: "donated", expiresAt: pastIso },
      { ...baseReq, _id: "keep_cancelled", status: "cancelled", expiresAt: pastIso },
      { ...baseReq, _id: "keep_rejected", status: "rejected", expiresAt: pastIso },
    ];

    memoryDatabase.bloodRequests = seedRequests;
    const totalBefore = memoryDatabase.bloodRequests.length;

    const expiredCount = await expireStaleRequests(now, BloodRequestMemoryModel);

    // Exactly 7 overdue active requests transitioned
    expect(expiredCount).toBe(7);

    // ZERO documents hard-deleted!
    expect(memoryDatabase.bloodRequests.length).toBe(totalBefore);

    const byId = new Map(memoryDatabase.bloodRequests.map((r) => [r._id, r]));

    for (const id of [
      "exp_pending",
      "exp_open",
      "exp_verified",
      "exp_matched",
      "exp_contacted",
      "exp_committed",
      "exp_legacy_open",
    ]) {
      const doc = byId.get(id)!;
      expect(doc.status).toBe("expired");
      expect(doc.expiresAt).toBeUndefined();
    }

    // Untouched records retain their exact statuses
    expect(byId.get("keep_future_verified")!.status).toBe("verified");
    expect(byId.get("keep_future_verified")!.expiresAt).toBe(futureIso);
    expect(byId.get("keep_fresh_legacy_open")!.status).toBe("open");
    expect(byId.get("keep_fulfilled")!.status).toBe("fulfilled");
    expect(byId.get("keep_donated")!.status).toBe("donated");
    expect(byId.get("keep_cancelled")!.status).toBe("cancelled");
    expect(byId.get("keep_rejected")!.status).toBe("rejected");

    // Re-running expiration is idempotent (0 newly expired)
    const secondRun = await expireStaleRequests(now, BloodRequestMemoryModel);
    expect(secondRun).toBe(0);

    // Active verified query excludes expired requests
    const activeVerified = (await BloodRequestMemoryModel.find({
      status: "verified",
      ...buildActiveExpiryFilter("verified", now),
    }).lean()) as MockBloodRequest[];
    expect(activeVerified.map((r) => r._id)).toEqual(["keep_future_verified"]);
  });

  test("fails gracefully and returns 0 when model throws or lacks updateMany", async () => {
    const failingModel = {
      updateMany: async () => {
        throw new Error("Simulated transient DB failure");
      },
    };
    expect(await expireStaleRequests(new Date(), failingModel)).toBe(0);
    expect(await expireStaleRequests(new Date(), {})).toBe(0);
  });
});

describe("4. Lifecycle Transitions, Committed Rollback & Automated Fulfillment Hooks", () => {
  let invalidatedPatterns: string[] = [];

  const createDeps = () => ({
    BloodRequest: BloodRequestMemoryModel,
    User: UserMemoryModel,
    DonationRecord: DonationRecordMemoryModel,
    AuditLog: AuditLogMemoryModel,
    invalidateCache: (pattern: string) => {
      invalidatedPatterns.push(pattern);
    },
  });

  beforeEach(() => {
    resetMemoryDatabase();
    invalidatedPatterns = [];
  });

  afterEach(() => {
    resetMemoryDatabase();
  });

  test("ALLOWED_TRANSITIONS includes committed rollback paths and legacy open/accepted paths", () => {
    expect(ALLOWED_TRANSITIONS.committed).toContain("matched");
    expect(ALLOWED_TRANSITIONS.committed).toContain("contacted");
    expect(ALLOWED_TRANSITIONS.committed).toContain("donated");
    expect(ALLOWED_TRANSITIONS.open).toContain("verified");
    expect(ALLOWED_TRANSITIONS.accepted).toContain("committed");
    expect(ALLOWED_TRANSITIONS.accepted).toContain("matched");

    expect(isValidStatusTransition("committed", "matched")).toBe(true);
    expect(isValidStatusTransition("committed", "contacted")).toBe(true);
    expect(isStatusRollback("committed", "matched")).toBe(true);
    expect(isStatusRollback("committed", "contacted")).toBe(true);
    expect(isStatusRollback("committed", "donated")).toBe(false);

    expect(
      determineStatusAuditAction({
        isValidTransition: false,
        override: true,
        previousStatus: "committed",
        newStatus: "fulfilled",
      })
    ).toBe("STATUS_OVERRIDE");
    expect(
      determineStatusAuditAction({
        isValidTransition: true,
        previousStatus: "committed",
        newStatus: "matched",
      })
    ).toBe("STATUS_ROLLBACK");
    expect(
      determineStatusAuditAction({
        isValidTransition: true,
        previousStatus: "committed",
        newStatus: "donated",
      })
    ).toBe("STATUS_UPDATE");
  });

  test("committed -> matched no-show rollback clears matchedDonor, keeps request active, and logs STATUS_ROLLBACK", async () => {
    const futureIso = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    memoryDatabase.bloodRequests.push({
      _id: "req_rollback_1",
      patientName: "Kamran Akmal",
      bloodType: "O-",
      units: 2,
      hospital: "Jinnah Hospital",
      city: "Karachi",
      urgency: "critical",
      contactPhone: "03001119999",
      requestedBy: "usr_recipient_1",
      status: "committed",
      matchedDonor: "usr_donor_2",
      isVerified: true,
      expiresAt: futureIso,
      declinedBy: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const result = await applyRequestStatusTransition(
      {
        requestId: "req_rollback_1",
        user: { userId: "usr_coordinator_1", role: "coordinator" },
        newStatus: "matched",
        reason: "Donor stuck in traffic and cannot reach hospital",
      },
      createDeps()
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.newStatus).toBe("matched");
    expect(result.auditAction).toBe("STATUS_ROLLBACK");

    const persisted = memoryDatabase.bloodRequests.find((r) => r._id === "req_rollback_1")!;
    expect(persisted.status).toBe("matched");
    expect(persisted.matchedDonor).toBeUndefined();
    expect(persisted.expiresAt).toBe(futureIso);

    const auditLogs = (memoryDatabase as any).auditLogs as any[];
    expect(auditLogs).toHaveLength(1);
    expect(auditLogs[0].action).toBe("STATUS_ROLLBACK");
    expect(auditLogs[0].details.previousMatchedDonor).toBe("usr_donor_2");
    expect(auditLogs[0].details.reason).toBe("Donor stuck in traffic and cannot reach hospital");

    // No DonationRecord should be created on rollback
    expect(memoryDatabase.donationRecords).toHaveLength(0);
    expect(invalidatedPatterns).toContain("requests");
  });

  test("committed -> contacted soft rollback preserves matchedDonor and logs STATUS_ROLLBACK", async () => {
    memoryDatabase.bloodRequests.push({
      _id: "req_rollback_2",
      patientName: "Sana Mir",
      bloodType: "B+",
      units: 1,
      hospital: "Liaquat National Hospital",
      city: "Karachi",
      urgency: "urgent",
      contactPhone: "03002223333",
      requestedBy: "usr_recipient_1",
      status: "committed",
      matchedDonor: "usr_donor_2",
      isVerified: true,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      declinedBy: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const result = await applyRequestStatusTransition(
      {
        requestId: "req_rollback_2",
        user: { userId: "usr_coordinator_1", role: "coordinator" },
        newStatus: "contacted",
        reason: "Re-confirming arrival slot with donor",
      },
      createDeps()
    );

    expect(result.ok).toBe(true);
    const persisted = memoryDatabase.bloodRequests.find((r) => r._id === "req_rollback_2")!;
    expect(persisted.status).toBe("contacted");
    expect(persisted.matchedDonor).toBe("usr_donor_2");

    const auditLogs = (memoryDatabase as any).auditLogs as any[];
    expect(auditLogs[0].action).toBe("STATUS_ROLLBACK");
  });

  test("committed -> donated sets lastDonatedAt, triggers 56-day cooldown, clears expiresAt, and creates ONE DonationRecord even after donated -> fulfilled", async () => {
    const donationTime = new Date("2026-11-19T14:00:00.000Z");
    const fulfillmentTime = new Date("2026-11-19T15:30:00.000Z");

    // usr_donor_3 is O- in Karachi with no prior lastDonatedAt
    const donorBefore = memoryDatabase.users.find((u) => u._id === "usr_donor_3")!;
    expect(donorBefore.lastDonatedAt).toBeUndefined();
    expect(isDonorEligibleByCooldown(donorBefore.lastDonatedAt, donationTime).eligible).toBe(true);

    memoryDatabase.bloodRequests.push({
      _id: "req_fulfill_1",
      patientName: "Ali Haider",
      bloodType: "O-",
      units: 2,
      hospital: "Aga Khan Hospital",
      city: "Karachi",
      urgency: "critical",
      contactPhone: "03119998888",
      requestedBy: "usr_recipient_1",
      status: "committed",
      matchedDonor: "usr_donor_3",
      isVerified: true,
      expiresAt: new Date("2026-11-21T14:00:00.000Z").toISOString(),
      declinedBy: [],
      createdAt: new Date("2026-11-19T10:00:00.000Z").toISOString(),
      updatedAt: new Date("2026-11-19T12:00:00.000Z").toISOString(),
    });

    // Step 1: committed -> donated
    const donatedRes = await applyRequestStatusTransition(
      {
        requestId: "req_fulfill_1",
        user: { userId: "usr_coordinator_1", role: "coordinator" },
        newStatus: "donated",
        reason: "Blood collected at hospital blood bank",
        now: donationTime,
      },
      createDeps()
    );

    expect(donatedRes.ok).toBe(true);
    if (!donatedRes.ok) return;

    expect(donatedRes.newStatus).toBe("donated");
    expect(donatedRes.auditAction).toBe("STATUS_UPDATE");
    expect(donatedRes.fulfillment?.created).toBe(true);
    expect(donatedRes.fulfillment?.donorUpdated).toBe(true);

    const reqAfterDonated = memoryDatabase.bloodRequests.find((r) => r._id === "req_fulfill_1")!;
    expect(reqAfterDonated.status).toBe("donated");
    expect(reqAfterDonated.expiresAt).toBeUndefined();
    expect(reqAfterDonated.matchedDonor).toBe("usr_donor_3");

    // Donor's lastDonatedAt updated -> immediately enters 56-day cooldown & excluded from matching engine
    const donorAfterDonated = memoryDatabase.users.find((u) => u._id === "usr_donor_3")!;
    expect(new Date(donorAfterDonated.lastDonatedAt!).toISOString()).toBe(donationTime.toISOString());

    const cooldownCheck = isDonorEligibleByCooldown(donorAfterDonated.lastDonatedAt, donationTime);
    expect(cooldownCheck.eligible).toBe(false);
    expect(cooldownCheck.daysRemaining).toBe(56);

    const eligibleAfter = findEligibleDonors(
      { _id: "req_next", bloodType: "O-", city: "Karachi" },
      [donorAfterDonated as any],
      donationTime
    );
    expect(eligibleAfter).toHaveLength(0);

    // Exactly 1 DonationRecord created with requestId
    expect(memoryDatabase.donationRecords).toHaveLength(1);
    expect(memoryDatabase.donationRecords[0]).toMatchObject({
      donorId: "usr_donor_3",
      requestId: "req_fulfill_1",
      hospital: "Aga Khan Hospital",
      city: "Karachi",
      units: 2,
    });

    expect(invalidatedPatterns).toContain("donors");
    expect(invalidatedPatterns).toContain("requests");

    // Step 2: donated -> fulfilled (must NOT duplicate DonationRecord or overwrite lastDonatedAt!)
    invalidatedPatterns = [];
    const fulfilledRes = await applyRequestStatusTransition(
      {
        requestId: "req_fulfill_1",
        user: { userId: "usr_coordinator_1", role: "coordinator" },
        newStatus: "fulfilled",
        reason: "Transfusion completed and verified",
        now: fulfillmentTime,
      },
      createDeps()
    );

    expect(fulfilledRes.ok).toBe(true);
    if (!fulfilledRes.ok) return;

    expect(fulfilledRes.newStatus).toBe("fulfilled");
    expect(fulfilledRes.auditAction).toBe("STATUS_UPDATE");
    expect(fulfilledRes.fulfillment?.created).toBe(false);
    expect(fulfilledRes.fulfillment?.donorUpdated).toBe(false);

    // Still EXACTLY ONE DonationRecord!
    expect(memoryDatabase.donationRecords).toHaveLength(1);

    // Original donation timestamp preserved
    const donorAfterFulfilled = memoryDatabase.users.find((u) => u._id === "usr_donor_3")!;
    expect(new Date(donorAfterFulfilled.lastDonatedAt!).toISOString()).toBe(donationTime.toISOString());

    const reqAfterFulfilled = memoryDatabase.bloodRequests.find((r) => r._id === "req_fulfill_1")!;
    expect(reqAfterFulfilled.status).toBe("fulfilled");
    expect(reqAfterFulfilled.expiresAt).toBeUndefined();
  });

  test("admin override committed -> fulfilled (skipping donated) logs STATUS_OVERRIDE and still runs fulfillment hook idempotently", async () => {
    const overrideTime = new Date("2026-11-19T16:00:00.000Z");

    memoryDatabase.bloodRequests.push({
      _id: "req_override_1",
      patientName: "Nadia Hussain",
      bloodType: "O-",
      units: 1,
      hospital: "Indus Hospital",
      city: "Karachi",
      urgency: "urgent",
      contactPhone: "03110001111",
      requestedBy: "usr_recipient_1",
      status: "committed",
      matchedDonor: "usr_donor_3",
      isVerified: true,
      expiresAt: new Date("2026-11-21T16:00:00.000Z").toISOString(),
      declinedBy: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Without override flag, skipping straight from committed -> fulfilled is rejected
    const blocked = await applyRequestStatusTransition(
      {
        requestId: "req_override_1",
        user: { userId: "usr_admin_1", role: "admin" },
        newStatus: "fulfilled",
      },
      createDeps()
    );
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.httpStatus).toBe(400);
    }

    // With override: true, admin succeeds
    const allowed = await applyRequestStatusTransition(
      {
        requestId: "req_override_1",
        user: { userId: "usr_admin_1", role: "admin" },
        newStatus: "fulfilled",
        override: true,
        reason: "Hospital confirmed direct completion",
        now: overrideTime,
      },
      createDeps()
    );

    expect(allowed.ok).toBe(true);
    if (!allowed.ok) return;

    expect(allowed.auditAction).toBe("STATUS_OVERRIDE");
    expect(allowed.fulfillment?.created).toBe(true);
    expect(memoryDatabase.donationRecords).toHaveLength(1);
    expect(memoryDatabase.bloodRequests.find((r) => r._id === "req_override_1")!.expiresAt).toBeUndefined();

    const donor = memoryDatabase.users.find((u) => u._id === "usr_donor_3")!;
    expect(new Date(donor.lastDonatedAt!).toISOString()).toBe(overrideTime.toISOString());

    const auditLogs = (memoryDatabase as any).auditLogs as any[];
    expect(auditLogs[0].action).toBe("STATUS_OVERRIDE");
    expect(auditLogs[0].details.override).toBe(true);
  });

  test("clears expiresAt on cancelled, rejected, and expired terminal transitions", async () => {
    const futureIso = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    memoryDatabase.bloodRequests.push(
      {
        _id: "req_cancel_1",
        patientName: "Patient A",
        bloodType: "A+",
        units: 1,
        hospital: "Civil Hospital",
        city: "Karachi",
        urgency: "normal",
        contactPhone: "03001110001",
        requestedBy: "usr_recipient_1",
        status: "pending",
        isVerified: false,
        expiresAt: futureIso,
        declinedBy: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        _id: "req_reject_1",
        patientName: "Patient B",
        bloodType: "B+",
        units: 1,
        hospital: "Civil Hospital",
        city: "Karachi",
        urgency: "normal",
        contactPhone: "03001110002",
        requestedBy: "usr_recipient_1",
        status: "pending",
        isVerified: false,
        expiresAt: futureIso,
        declinedBy: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );

    // Request owner cancels their own request
    const cancelRes = await applyRequestStatusTransition(
      {
        requestId: "req_cancel_1",
        user: { userId: "usr_recipient_1", role: "recipient" },
        newStatus: "cancelled",
      },
      createDeps()
    );
    expect(cancelRes.ok).toBe(true);
    expect(memoryDatabase.bloodRequests.find((r) => r._id === "req_cancel_1")!.expiresAt).toBeUndefined();

    // Coordinator rejects a pending request
    const rejectRes = await applyRequestStatusTransition(
      {
        requestId: "req_reject_1",
        user: { userId: "usr_coordinator_1", role: "coordinator" },
        newStatus: "rejected",
        reason: "Unverifiable hospital details",
      },
      createDeps()
    );
    expect(rejectRes.ok).toBe(true);
    expect(memoryDatabase.bloodRequests.find((r) => r._id === "req_reject_1")!.expiresAt).toBeUndefined();
  });

  test("recordDonationFulfillment handles MongoDB duplicate key race (code 11000) idempotently", async () => {
    const raceDeps = {
      User: UserMemoryModel,
      DonationRecord: {
        findOne: async () => null,
        create: async () => {
          const dupErr: any = new Error("E11000 duplicate key error");
          dupErr.code = 11000;
          throw dupErr;
        },
      },
      invalidateCache: () => {},
    };

    const res = await recordDonationFulfillment(
      {
        requestId: "req_race_1",
        donorId: "usr_donor_3",
        hospital: "Aga Khan Hospital",
        city: "Karachi",
        units: 1,
      },
      raceDeps
    );

    expect(res.created).toBe(false);
    expect(res.donorUpdated).toBe(false);
  });

  test("external fulfillment without matchedDonor clears expiresAt cleanly and creates zero DonationRecords", async () => {
    memoryDatabase.bloodRequests.push({
      _id: "req_external_1",
      patientName: "External Patient",
      bloodType: "A-",
      units: 1,
      hospital: "SIUT",
      city: "Karachi",
      urgency: "urgent",
      contactPhone: "03003334444",
      requestedBy: "usr_recipient_1",
      status: "verified",
      isVerified: true,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      declinedBy: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const res = await applyRequestStatusTransition(
      {
        requestId: "req_external_1",
        user: { userId: "usr_admin_1", role: "admin" },
        newStatus: "fulfilled",
        override: true,
        reason: "Fulfilled externally via hospital blood bank",
      },
      createDeps()
    );

    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.auditAction).toBe("STATUS_OVERRIDE");
    expect(res.fulfillment).toBeNull();
    expect(memoryDatabase.donationRecords).toHaveLength(0);
    expect(memoryDatabase.bloodRequests.find((r) => r._id === "req_external_1")!.expiresAt).toBeUndefined();
  });

  test("UserMemoryModel $unset clears expired OTP fields without deleting User document", async () => {
    const userCountBefore = memoryDatabase.users.length;
    await UserMemoryModel.findByIdAndUpdate("usr_donor_1", {
      $set: {
        emailVerificationOtp: "123456",
        emailVerificationOtpExpiry: new Date(Date.now() - 60_000).toISOString(),
      },
    });

    await UserMemoryModel.findByIdAndUpdate("usr_donor_1", {
      $unset: { emailVerificationOtp: 1, emailVerificationOtpExpiry: 1 },
    });

    const user = await UserMemoryModel.findById("usr_donor_1");
    expect(user).not.toBeNull();
    expect(memoryDatabase.users.length).toBe(userCountBefore);
    expect(user!.emailVerificationOtp).toBeUndefined();
    expect(user!.emailVerificationOtpExpiry).toBeUndefined();
  });
});
