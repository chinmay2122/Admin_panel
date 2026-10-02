/**
 * Centralized Role-Based Access Control (RBAC) System
 * Compliant with OWASP ASVS Section V4 (Access Control Verification)
 */

export type AppRole =
  | "super_admin"
  | "admin"
  | "moderator"
  | "creator"
  | "collector"
  | "user"
  | "anonymous";

export type Permission =
  | "report:view"
  | "report:create"
  | "report:resolve"
  | "report:dismiss"
  | "artwork:view_all"
  | "artwork:hide"
  | "artwork:remove"
  | "user:view_all"
  | "user:suspend"
  | "user:manage"
  | "user:change_role"
  | "analytics:view"
  | "audit:view"
  | "audit:export"
  | "settings:manage";

const ROLE_PERMISSIONS: Record<AppRole, readonly Permission[]> = {
  super_admin: [
    "report:view",
    "report:create",
    "report:resolve",
    "report:dismiss",
    "artwork:view_all",
    "artwork:hide",
    "artwork:remove",
    "user:view_all",
    "user:suspend",
    "user:manage",
    "user:change_role",
    "analytics:view",
    "audit:view",
    "audit:export",
    "settings:manage",
  ],
  admin: [
    "report:view",
    "report:create",
    "report:resolve",
    "report:dismiss",
    "artwork:view_all",
    "artwork:hide",
    "artwork:remove",
    "user:view_all",
    "user:suspend",
    "user:manage",
    "analytics:view",
    "audit:view",
    "audit:export",
    "settings:manage",
  ],
  moderator: [
    "report:view",
    "report:create",
    "report:resolve",
    "report:dismiss",
    "artwork:view_all",
    "artwork:hide",
    "audit:view",
  ],
  creator: ["report:create"],
  collector: ["report:create"],
  user: ["report:create"],
  anonymous: [],
};

const ROLE_HIERARCHY: Record<AppRole, number> = {
  super_admin: 100,
  admin: 80,
  moderator: 60,
  creator: 20,
  collector: 20,
  user: 10,
  anonymous: 0,
};

/**
 * Normalizes input role strings safely to a recognized AppRole.
 */
export function normalizeRole(role: string | undefined | null): AppRole {
  if (!role) return "anonymous";
  const r = role.toLowerCase().trim();
  if (r === "super_admin" || r === "superadmin") return "super_admin";
  if (r === "admin") return "admin";
  if (r === "moderator" || r === "mod") return "moderator";
  if (r === "creator") return "creator";
  if (r === "collector") return "collector";
  if (r === "user") return "user";
  return "anonymous";
}

/**
 * Validates if a role has the specified permission.
 */
export function hasPermission(role: string | undefined | null, permission: Permission): boolean {
  const normalized = normalizeRole(role);
  const permissions = ROLE_PERMISSIONS[normalized] || [];
  return permissions.includes(permission);
}

/**
 * Checks if a role is authorized for administrative dashboard access.
 */
export function isAdminOrModerator(role: string | undefined | null): boolean {
  const normalized = normalizeRole(role);
  return normalized === "super_admin" || normalized === "admin" || normalized === "moderator";
}

/**
 * Enforces role hierarchy for sensitive moderation actions.
 * Lower-level roles cannot suspend, modify, or demote equal or higher-level roles.
 */
export function canModerateTarget(
  actorRole: string | undefined | null,
  targetRole: string | undefined | null,
  isSelf: boolean
): { allowed: boolean; reason?: string } {
  if (isSelf) {
    return { allowed: false, reason: "Self-moderation and self-suspension are strictly prohibited." };
  }

  const actor = normalizeRole(actorRole);
  const target = normalizeRole(targetRole);

  const actorScore = ROLE_HIERARCHY[actor] || 0;
  const targetScore = ROLE_HIERARCHY[target] || 0;

  if (actorScore < 80) {
    return { allowed: false, reason: "Moderator accounts do not have permission to suspend accounts." };
  }

  if (actorScore <= targetScore && actor !== "super_admin") {
    return {
      allowed: false,
      reason: "Administrators cannot suspend or modify users of equal or higher administrative rank.",
    };
  }

  return { allowed: true };
}
