/**
 * @file expiration.ts
 * @description Soft-expiration logic, request lifecycle transition rules, rollback handling,
 * and idempotent automated fulfillment hooks (no hard deletes).
 */

import { BloodRequest } from "@/lib/models/BloodRequest";
import { User } from "@/lib/models/User";
import { DonationRecord } from "@/lib/models/DonationRecord";
import { AuditLog } from "@/lib/models/AuditLog";
import { invalidateCache } from "@/lib/cache";
import { logger } from "@/lib/logger";

export const EXPIRABLE_STATUSES = [
  "pending",
  "open",
  "verified",
  "matched",
  "contacted",
  "committed",
] as const;

export const TERMINAL_OR_COMPLETED_STATUSES = [
  "donated",
  "fulfilled",
  "rejected",
  "cancelled",
  "expired",
] as const;

export const LEGACY_OPEN_EXPIRY_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

export type ExpirableStatus = (typeof EXPIRABLE_STATUSES)[number];
export type TerminalOrCompletedStatus = (typeof TERMINAL_OR_COMPLETED_STATUSES)[number];
export type StatusAuditAction = "STATUS_OVERRIDE" | "STATUS_ROLLBACK" | "STATUS_UPDATE";

const EXPIRABLE_STATUS_SET = new Set<string>(EXPIRABLE_STATUSES);
const TERMINAL_OR_COMPLETED_SET = new Set<string>(TERMINAL_OR_COMPLETED_STATUSES);

/**
 * Allowed status transitions across the 8-state fulfillment pipeline + legacy open/accepted states.
 * Includes no-show rollback paths from `committed` back to `matched` / `contacted`.
 */
export const ALLOWED_TRANSITIONS: Record<string, readonly string[]> = {
  pending: ["verified", "rejected", "expired", "cancelled"],
  open: ["verified", "matched", "accepted", "rejected", "expired", "cancelled"],
  verified: ["matched", "expired", "cancelled"],
  matched: ["contacted", "expired", "cancelled"],
  contacted: ["committed", "expired", "cancelled"],
  committed: ["donated", "matched", "contacted", "expired", "cancelled"],
  accepted: ["committed", "donated", "fulfilled", "matched", "expired", "cancelled"],
  donated: ["fulfilled"],
  fulfilled: [],
  rejected: [],
  expired: [],
  cancelled: [],
};

export interface ExpirableRequestLike {
  status?: string;
  expiresAt?: Date | string | null;
  createdAt?: Date | string | null;
}

export interface ExpirableRequestModel {
  updateMany?: (
    filter: Record<string, unknown>,
    update: Record<string, unknown>
  ) => Promise<{ modifiedCount?: number; nModified?: number } | unknown>;
}

/**
 * Returns true if the given status is an active, expirable lifecycle state.
 */
export function isExpirableStatus(status?: string | null): boolean {
  return Boolean(status && EXPIRABLE_STATUS_SET.has(status));
}

/**
 * Returns true if the given status is completed or terminal (expiresAt must be cleared).
 */
export function isTerminalOrCompletedStatus(status?: string | null): boolean {
  return Boolean(status && TERMINAL_OR_COMPLETED_SET.has(status));
}

/**
 * Pure helper that determines whether a blood request is overdue for soft expiration.
 * Completed/terminal requests are NEVER considered expired.
 */
export function isRequestExpired(
  req: ExpirableRequestLike,
  referenceDate: Date = new Date()
): boolean {
  if (!req.status || !EXPIRABLE_STATUS_SET.has(req.status)) {
    return false;
  }

  const refTime = referenceDate.getTime();
  if (Number.isNaN(refTime)) {
    return false;
  }

  if (req.expiresAt !== null && req.expiresAt !== undefined) {
    const expiresTime =
      req.expiresAt instanceof Date
        ? req.expiresAt.getTime()
        : new Date(req.expiresAt).getTime();

    if (!Number.isNaN(expiresTime)) {
      return expiresTime <= refTime;
    }
  }

  // Legacy open requests with no expiresAt expire 3 days after createdAt
  if (req.status === "open" && req.createdAt !== null && req.createdAt !== undefined) {
    const createdTime =
      req.createdAt instanceof Date
        ? req.createdAt.getTime()
        : new Date(req.createdAt).getTime();

    if (!Number.isNaN(createdTime)) {
      return createdTime <= refTime - LEGACY_OPEN_EXPIRY_MS;
    }
  }

  return false;
}

/**
 * Builds a defense-in-depth MongoDB/memoryStore query clause that excludes overdue requests
 * when filtering by an active non-terminal status.
 */
export function buildActiveExpiryFilter(
  status: string,
  referenceDate: Date = new Date()
): Record<string, unknown> | null {
  if (!isExpirableStatus(status)) {
    return null;
  }

  if (status === "open") {
    const threeDaysAgo = new Date(referenceDate.getTime() - LEGACY_OPEN_EXPIRY_MS);
    return {
      $or: [
        { expiresAt: null, createdAt: { $gt: threeDaysAgo } },
        { expiresAt: { $gt: referenceDate } },
      ],
    };
  }

  return {
    $or: [{ expiresAt: null }, { expiresAt: { $gt: referenceDate } }],
  };
}

/**
 * Soft-expires overdue active blood requests by transitioning them to `status: "expired"`
 * and unsetting `expiresAt` — NEVER hard-deleting documents.
 * Compatible with both Mongoose models and BloodRequestMemoryModel.
 */
export async function expireStaleRequests(
  referenceDate: Date = new Date(),
  model: ExpirableRequestModel = BloodRequest
): Promise<number> {
  try {
    if (!model || typeof model.updateMany !== "function") {
      logger.error("[Expiration:expireStaleRequests] Model does not support updateMany");
      return 0;
    }

    const legacyCutoff = new Date(referenceDate.getTime() - LEGACY_OPEN_EXPIRY_MS);

    const filter: Record<string, unknown> = {
      $or: [
        {
          status: { $in: [...EXPIRABLE_STATUSES] },
          expiresAt: { $lte: referenceDate },
        },
        {
          status: "open",
          expiresAt: null,
          createdAt: { $lte: legacyCutoff },
        },
      ],
    };

    const update: Record<string, unknown> = {
      $set: { status: "expired" },
      $unset: { expiresAt: "" },
    };

    const result = (await model.updateMany(filter, update)) as
      | { modifiedCount?: number; nModified?: number }
      | undefined;

    return result?.modifiedCount ?? result?.nModified ?? 0;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("[Expiration:expireStaleRequests] Failed to expire stale requests", {
      error: err.message,
      stack: err.stack,
    });
    return 0;
  }
}

/**
 * Checks whether transitioning from `previousStatus` to `newStatus` is allowed without override.
 */
export function isValidStatusTransition(previousStatus: string, newStatus: string): boolean {
  return Boolean(ALLOWED_TRANSITIONS[previousStatus]?.includes(newStatus));
}

/**
 * Returns true if the transition represents a donor commitment rollback (no-show / schedule change).
 */
export function isStatusRollback(previousStatus: string, newStatus: string): boolean {
  if (previousStatus === "committed" && (newStatus === "matched" || newStatus === "contacted")) {
    return true;
  }
  if (previousStatus === "accepted" && newStatus === "matched") {
    return true;
  }
  return false;
}

/**
 * Returns true when rolling back a committed/accepted request back to `matched`,
 * requiring `matchedDonor` to be cleared so another donor can be matched/accepted.
 */
export function shouldClearMatchedDonorOnTransition(
  previousStatus: string,
  newStatus: string
): boolean {
  return (previousStatus === "committed" || previousStatus === "accepted") && newStatus === "matched";
}

/**
 * Determines the AuditLog action name for a status transition.
 */
export function determineStatusAuditAction(params: {
  isValidTransition: boolean;
  override?: boolean;
  previousStatus: string;
  newStatus: string;
}): StatusAuditAction {
  if (!params.isValidTransition && params.override) {
    return "STATUS_OVERRIDE";
  }
  if (isStatusRollback(params.previousStatus, params.newStatus)) {
    return "STATUS_ROLLBACK";
  }
  return "STATUS_UPDATE";
}

/**
 * Safely extracts a string ID from a string, Mongoose ObjectId, populated doc, or memoryStore ref.
 */
export function extractEntityId(ref: unknown): string | null {
  if (!ref) return null;
  if (typeof ref === "string") return ref;
  if (typeof ref === "object") {
    const obj = ref as { _id?: unknown; toString?: () => string };
    if (obj._id !== undefined && obj._id !== null) {
      return String(obj._id);
    }
    if (typeof obj.toString === "function") {
      const str = obj.toString();
      return str && str !== "[object Object]" ? str : null;
    }
  }
  return null;
}

export interface FulfillmentDeps {
  User: {
    findByIdAndUpdate: (id: string, update: Record<string, unknown>, options?: Record<string, unknown>) => any;
  };
  DonationRecord: {
    findOne: (query: Record<string, unknown>) => any;
    create: (data: Record<string, unknown>) => Promise<any>;
  };
  invalidateCache: (pattern: string) => void;
}

export interface FulfillmentHookParams {
  requestId: string;
  donorId: string;
  recipientName?: string;
  hospital?: string;
  city: string;
  units: number;
  notes?: string;
  donatedAt?: Date;
}

export interface FulfillmentHookResult {
  created: boolean;
  donorUpdated: boolean;
  record: any | null;
}

/**
 * Idempotently creates a DonationRecord for a fulfilled/donated blood request
 * and updates the matched donor's `lastDonatedAt` (triggering the 56-day cooldown).
 */
export async function recordDonationFulfillment(
  params: FulfillmentHookParams,
  deps: FulfillmentDeps = { User, DonationRecord, invalidateCache }
): Promise<FulfillmentHookResult> {
  const existingRecord = await deps.DonationRecord.findOne({ requestId: params.requestId });
  if (existingRecord) {
    return {
      created: false,
      donorUpdated: false,
      record: existingRecord,
    };
  }

  const donatedAt = params.donatedAt ?? new Date();
  let createdRecord: any;

  try {
    createdRecord = await deps.DonationRecord.create({
      donorId: params.donorId,
      requestId: params.requestId,
      recipientName: params.recipientName,
      hospital: params.hospital,
      city: params.city,
      units: params.units,
      donatedAt,
      notes: params.notes?.trim() || `Donation fulfilled for blood request ${params.requestId}`,
    });
  } catch (err: any) {
    // Handle race condition against sparse unique index on requestId
    if (err?.code === 11000) {
      const concurrentRecord = await deps.DonationRecord.findOne({ requestId: params.requestId });
      return {
        created: false,
        donorUpdated: false,
        record: concurrentRecord || null,
      };
    }
    throw err;
  }

  await deps.User.findByIdAndUpdate(params.donorId, {
    $set: { lastDonatedAt: donatedAt },
  });

  deps.invalidateCache("donors");

  return {
    created: true,
    donorUpdated: true,
    record: createdRecord,
  };
}

export interface StatusTransitionUser {
  userId: string;
  role: string;
}

export interface StatusTransitionParams {
  requestId: string;
  user: StatusTransitionUser;
  newStatus: string;
  reason?: string;
  override?: boolean;
  now?: Date;
}

export interface StatusTransitionDeps extends FulfillmentDeps {
  BloodRequest: {
    findById: (id: string) => Promise<any>;
  };
  AuditLog: {
    create: (data: Record<string, unknown>) => Promise<any>;
  };
}

export type StatusTransitionResult =
  | {
      ok: false;
      httpStatus: 400 | 403 | 404;
      error: string;
    }
  | {
      ok: true;
      httpStatus: 200;
      unchanged?: boolean;
      message: string;
      previousStatus: string;
      newStatus: string;
      request: any;
      auditAction?: StatusAuditAction;
      fulfillment?: FulfillmentHookResult | null;
    };

/**
 * Executes a validated blood request lifecycle transition:
 * - Enforces ownership & role authorization
 * - Validates allowed transitions and admin/coordinator overrides
 * - Handles no-show rollbacks (`committed` -> `matched` clears `matchedDonor`)
 * - Clears `expiresAt` on completed/terminal states
 * - Automatically & idempotently records DonationRecord + donor `lastDonatedAt` on `donated` / `fulfilled`
 * - Writes structured AuditLog entries and invalidates caches
 */
export async function applyRequestStatusTransition(
  params: StatusTransitionParams,
  deps: StatusTransitionDeps = {
    BloodRequest,
    User,
    DonationRecord,
    AuditLog,
    invalidateCache,
  }
): Promise<StatusTransitionResult> {
  const { requestId, user, newStatus, reason, override, now } = params;

  const bloodRequest = await deps.BloodRequest.findById(requestId);
  if (!bloodRequest) {
    return { ok: false, httpStatus: 404, error: "Blood request not found." };
  }

  const requestedById = extractEntityId(bloodRequest.requestedBy);
  const isOwner = requestedById === user.userId;
  const isPrivileged = user.role === "admin" || user.role === "coordinator";

  if (!isOwner && !isPrivileged) {
    return {
      ok: false,
      httpStatus: 403,
      error: "Forbidden. Only the request owner, coordinators, or administrators can update status.",
    };
  }

  const previousStatus: string = bloodRequest.status;

  if (newStatus === previousStatus) {
    return {
      ok: true,
      httpStatus: 200,
      unchanged: true,
      message: "Status is already up to date.",
      previousStatus,
      newStatus,
      request: bloodRequest,
    };
  }

  // Owner restriction: Owners can only cancel their own requests unless they are also privileged
  if (isOwner && !isPrivileged && newStatus !== "cancelled") {
    return {
      ok: false,
      httpStatus: 403,
      error: "Forbidden. Request owners can only transition status to 'cancelled'.",
    };
  }

  const isValidTransition = isValidStatusTransition(previousStatus, newStatus);
  if (!isValidTransition && (!isPrivileged || !override)) {
    return {
      ok: false,
      httpStatus: 400,
      error: `Invalid status transition from '${previousStatus}' to '${newStatus}'. Privileged users may bypass this by providing the 'override: true' flag.`,
    };
  }

  const matchedDonorId = extractEntityId(bloodRequest.matchedDonor);
  const isRollback = isStatusRollback(previousStatus, newStatus);
  const clearMatchedDonor = shouldClearMatchedDonorOnTransition(previousStatus, newStatus);
  const previousMatchedDonor = clearMatchedDonor ? matchedDonorId : null;

  bloodRequest.status = newStatus;

  if (newStatus === "verified") {
    bloodRequest.isVerified = true;
  }

  if (clearMatchedDonor) {
    bloodRequest.matchedDonor = undefined;
  }

  if (isTerminalOrCompletedStatus(newStatus)) {
    bloodRequest.expiresAt = undefined;
  }

  await bloodRequest.save();

  // Automated fulfillment hook on `donated` (or `fulfilled` fallback when skipped via override/legacy)
  let fulfillment: FulfillmentHookResult | null = null;
  if ((newStatus === "donated" || newStatus === "fulfilled") && matchedDonorId) {
    const requestIdStr = extractEntityId(bloodRequest._id) ?? requestId;
    fulfillment = await recordDonationFulfillment(
      {
        requestId: requestIdStr,
        donorId: matchedDonorId,
        recipientName: bloodRequest.patientName,
        hospital: bloodRequest.hospital,
        city: bloodRequest.city,
        units: bloodRequest.units,
        notes: reason,
        donatedAt: now,
      },
      deps
    );
  }

  const auditAction = determineStatusAuditAction({
    isValidTransition,
    override,
    previousStatus,
    newStatus,
  });

  if (isPrivileged || isRollback || reason) {
    await deps.AuditLog.create({
      action: auditAction,
      performedBy: user.userId,
      targetId: bloodRequest._id,
      details: {
        previousStatus,
        newStatus,
        reason: reason?.trim() || "",
        userRole: user.role,
        ...(!isValidTransition && override ? { override: true } : {}),
        ...(previousMatchedDonor ? { previousMatchedDonor } : {}),
      },
    });
  }

  deps.invalidateCache("requests");

  return {
    ok: true,
    httpStatus: 200,
    message: `Status updated to '${newStatus}'.`,
    previousStatus,
    newStatus,
    request: bloodRequest,
    auditAction,
    fulfillment,
  };
}
