/**
 * Security Input Validation, Mass Assignment Protection & Error Sanitization
 * Compliant with OWASP ASVS Section V5 (Validation, Sanitization, and Encoding)
 */

import { Artwork, Creator, User, ReportStatus } from "@/lib/types";

// Valid UUID format regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
// Valid local/prefixed ID regex (e.g. art_xxx, usr_xxx, rep_xxx)
const PREFIXED_ID_REGEX = /^[a-z]{3}_[a-z0-9_-]{3,64}$/i;

/**
 * Validates whether an identifier is safe and in expected format.
 */
export function isValidId(id: unknown): id is string {
  if (typeof id !== "string" || !id.trim()) return false;
  const clean = id.trim();
  if (clean.length > 128) return false;
  return UUID_REGEX.test(clean) || PREFIXED_ID_REGEX.test(clean);
}

/**
 * Allowed report reasons allowlist (prevents parameter tampering)
 */
export const ALLOWED_REPORT_REASONS = [
  "Inappropriate content",
  "Copyright violation",
  "Spam or scam",
  "Misleading information",
  "Harassment or abuse",
  "Other",
] as const;

export function isValidReportReason(reason: string): boolean {
  if (!reason || typeof reason !== "string") return false;
  return ALLOWED_REPORT_REASONS.includes(reason.trim() as any);
}

/**
 * Validates permitted report state transitions (State Machine Security)
 * Only 'pending' can transition to 'resolved' or 'dismissed'.
 * Re-resolving, re-dismissing, or moving backwards is strictly rejected.
 */
export function isValidReportStateTransition(
  currentStatus: ReportStatus,
  targetStatus: ReportStatus
): { valid: boolean; error?: string } {
  if (currentStatus === targetStatus) {
    return { valid: false, error: `Report is already marked as ${targetStatus}.` };
  }

  if (currentStatus !== "pending") {
    return {
      valid: false,
      error: `Illegal state transition: Cannot change status of an already ${currentStatus} report.`,
    };
  }

  if (targetStatus !== "resolved" && targetStatus !== "dismissed") {
    return {
      valid: false,
      error: `Invalid target status '${targetStatus}'. Allowed: 'resolved' or 'dismissed'.`,
    };
  }

  return { valid: true };
}

/**
 * Mass Assignment Prevention: Artwork updates
 * Strictly filters out caller attempts to overwrite creator_id, id, created_at, or internal fields.
 */
export function filterSafeArtworkUpdates(data: Partial<Artwork>): Partial<Artwork> {
  const safe: Partial<Artwork> = {};

  if (typeof data.title === "string" && data.title.trim()) {
    safe.title = data.title.trim().slice(0, 200);
  }
  if (typeof data.price === "number" && !isNaN(data.price) && data.price >= 0) {
    safe.price = Number(data.price);
  }
  if (data.status && ["published", "draft", "Available", "For Sale", "Sold", "Not for sale"].includes(data.status)) {
    safe.status = data.status;
  }
  if (typeof data.dimensions === "string") {
    safe.dimensions = data.dimensions.trim().slice(0, 100);
  }
  if (typeof data.medium === "string") {
    safe.medium = data.medium.trim().slice(0, 100);
  }
  if (typeof data.description === "string") {
    safe.description = data.description.trim().slice(0, 4000);
  }
  if (typeof data.imageUrl === "string" && data.imageUrl.startsWith("http")) {
    safe.imageUrl = data.imageUrl.trim();
  }

  return safe;
}

/**
 * Mass Assignment Prevention: User profile updates
 * Strictly prevents normal callers or unauthorized admins from escalating role, plan, or tamper-protected fields.
 */
export function filterSafeUserUpdates(
  data: Partial<User>,
  options: { allowRoleChange?: boolean } = {}
): Partial<User> {
  const safe: Partial<User> = {};

  if (typeof data.name === "string" && data.name.trim()) {
    safe.name = data.name.trim().slice(0, 150);
  }

  if (data.status && ["active", "suspended"].includes(data.status)) {
    safe.status = data.status;
  }

  // Role changes only permitted if explicitly authorized by super_admin
  if (options.allowRoleChange && data.role && ["creator", "collector"].includes(data.role)) {
    safe.role = data.role;
  }

  return safe;
}

/**
 * Mass Assignment Prevention: Creator profile updates
 */
export function filterSafeCreatorUpdates(data: Partial<Creator>): Partial<Creator> {
  const safe: Partial<Creator> = {};

  if (typeof data.name === "string" && data.name.trim()) {
    safe.name = data.name.trim().slice(0, 150);
  }
  if (typeof data.discipline === "string") {
    safe.discipline = data.discipline.trim().slice(0, 100);
  }
  if (data.status && ["active", "pending", "suspended"].includes(data.status)) {
    safe.status = data.status;
  }

  return safe;
}

/**
 * Sanitizes server error messages before sending to client.
 * Prevents information disclosure (OWASP ASVS Section V7: Error Handling & Logging).
 */
export function sanitizeClientError(error: unknown, fallbackMessage = "An unexpected error occurred."): string {
  if (!error) return fallbackMessage;

  const msg = typeof error === "string" ? error : (error as any)?.message || "";

  // Known safe business-logic validation errors
  const safePhrases = [
    "Unauthorized",
    "Invalid",
    "required",
    "not found",
    "already",
    "exceeded",
    "prohibited",
    "Cannot change status",
    "Please select",
    "Too many attempts",
  ];

  const isSafe = safePhrases.some((phrase) => msg.toLowerCase().includes(phrase.toLowerCase()));

  // If error mentions SQL, database, syntax, internal paths, or driver, do not leak it
  const isDangerous =
    /select|insert|update|delete|table|column|postgres|supabase|jwt|key|secret|relation|syntax error|null value in column/i.test(
      msg
    );

  if (isSafe && !isDangerous) {
    return msg;
  }

  return fallbackMessage;
}

/**
 * Validates and sanitizes platform settings updates (OWASP ASVS Input Validation)
 */
export function validatePlatformSettings(data: unknown): {
  valid: boolean;
  errors?: Record<string, string>;
  sanitized?: Partial<import("@/lib/types").PlatformSettings>;
} {
  if (!data || typeof data !== "object") {
    return { valid: false, errors: { general: "Invalid settings payload." } };
  }

  const errors: Record<string, string> = {};
  const sanitized: Partial<import("@/lib/types").PlatformSettings> = {};
  const raw = data as Record<string, any>;

  // Free Artwork Limit
  if (raw.freeArtworkLimit !== undefined) {
    const val = Number(raw.freeArtworkLimit);
    if (!Number.isInteger(val) || val < 0) {
      errors.freeArtworkLimit = "Free artwork limit must be an integer 0 or greater.";
    } else if (val > 10000) {
      errors.freeArtworkLimit = "Free artwork limit cannot exceed 10,000.";
    } else {
      sanitized.freeArtworkLimit = val;
    }
  }

  // Lite Artwork Limit
  if (raw.liteArtworkLimit !== undefined) {
    const val = Number(raw.liteArtworkLimit);
    if (!Number.isInteger(val) || val < 0) {
      errors.liteArtworkLimit = "Lite artwork limit must be an integer 0 or greater.";
    } else if (val > 10000) {
      errors.liteArtworkLimit = "Lite artwork limit cannot exceed 10,000.";
    } else {
      sanitized.liteArtworkLimit = val;
    }
  }

  // Pro Artwork Limit
  if (raw.proArtworkLimit !== undefined) {
    const val = Number(raw.proArtworkLimit);
    if (!Number.isInteger(val) || val < 0) {
      errors.proArtworkLimit = "Pro artwork limit must be an integer 0 or greater.";
    } else if (val > 10000) {
      errors.proArtworkLimit = "Pro artwork limit cannot exceed 10,000.";
    } else {
      sanitized.proArtworkLimit = val;
    }
  }

  // Invite Request Limit
  if (raw.inviteRequestLimit !== undefined) {
    const val = Number(raw.inviteRequestLimit);
    if (!Number.isInteger(val) || val < 0) {
      errors.inviteRequestLimit = "Invite request limit must be an integer 0 or greater.";
    } else if (val > 10000) {
      errors.inviteRequestLimit = "Invite request limit cannot exceed 10,000.";
    } else {
      sanitized.inviteRequestLimit = val;
    }
  }

  // Boolean Platform Controls
  if (raw.corEnabled !== undefined) {
    sanitized.corEnabled = Boolean(raw.corEnabled);
  }

  if (raw.featuredCreatorControlsEnabled !== undefined) {
    sanitized.featuredCreatorControlsEnabled = Boolean(raw.featuredCreatorControlsEnabled);
  }

  if (raw.moderationSettingsEnabled !== undefined) {
    sanitized.moderationSettingsEnabled = Boolean(raw.moderationSettingsEnabled);
  }

  // Platform Announcement
  if (raw.platformAnnouncement !== undefined) {
    if (typeof raw.platformAnnouncement !== "string") {
      errors.platformAnnouncement = "Platform announcement must be text.";
    } else {
      const trimmed = raw.platformAnnouncement.trim();
      if (trimmed.length > 1000) {
        errors.platformAnnouncement = "Platform announcement cannot exceed 1,000 characters.";
      } else {
        sanitized.platformAnnouncement = trimmed.replace(/<[^>]*>?/gm, "");
      }
    }
  }

  // Default Profile Visibility
  if (raw.defaultProfileVisibility !== undefined) {
    if (raw.defaultProfileVisibility !== "public" && raw.defaultProfileVisibility !== "private") {
      errors.defaultProfileVisibility = "Visibility must be 'public' or 'private'.";
    } else {
      sanitized.defaultProfileVisibility = raw.defaultProfileVisibility;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
    sanitized: Object.keys(errors).length === 0 ? sanitized : undefined,
  };
}
