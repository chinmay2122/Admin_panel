/**
 * Automated Security Test Suite & Attack Simulation Matrix
 * Validates OWASP ASVS & OWASP Top 10:2025 Security Controls
 * Run: npx tsx scripts/security-audit-test.ts
 */

import { hasPermission, canModerateTarget, isAdminOrModerator, normalizeRole, AppRole } from "../lib/security/rbac";
import { isValidId, isValidReportReason, isValidReportStateTransition, filterSafeArtworkUpdates, filterSafeUserUpdates } from "../lib/security/validators";
import { globalRateLimiter, RATE_LIMIT_CONFIGS } from "../lib/security/rateLimit";

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(description: string, condition: boolean, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${description}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${description} ${detail ? `(${detail})` : ""}`);
  }
}

console.log("\n========================================================");
console.log("   ERASSTUDIO ADMIN SYSTEM SECURITY AUDIT TEST SUITE    ");
console.log("   OWASP ASVS & Top 10:2025 Penetration Resistance      ");
console.log("========================================================\n");

// 1. Role-Based Access Control (RBAC) Matrix
console.log("✦ SECTION 1: Centralized Access Control (ASVS V4)");
const roles: AppRole[] = ["anonymous", "user", "creator", "collector", "moderator", "admin", "super_admin"];

assert("Anonymous cannot access admin dashboard", !isAdminOrModerator("anonymous"));
assert("Normal User cannot access admin dashboard", !isAdminOrModerator("user"));
assert("Creator cannot access admin dashboard", !isAdminOrModerator("creator"));
assert("Collector cannot access admin dashboard", !isAdminOrModerator("collector"));
assert("Moderator CAN access moderation dashboard", isAdminOrModerator("moderator"));
assert("Admin CAN access admin dashboard", isAdminOrModerator("admin"));
assert("Super Admin CAN access admin dashboard", isAdminOrModerator("super_admin"));

// Moderation permissions
assert("Normal user CANNOT view moderation reports", !hasPermission("user", "report:view"));
assert("Moderator CAN view moderation reports", hasPermission("moderator", "report:view"));
assert("Moderator CAN dismiss reports", hasPermission("moderator", "report:dismiss"));
assert("Moderator CAN resolve reports", hasPermission("moderator", "report:resolve"));
assert("Moderator CAN hide artwork", hasPermission("moderator", "artwork:hide"));
assert("Moderator CANNOT remove artwork", !hasPermission("moderator", "artwork:remove"));
assert("Moderator CANNOT suspend user", !hasPermission("moderator", "user:suspend"));
assert("Moderator CANNOT change user roles", !hasPermission("moderator", "user:change_role"));

assert("Admin CAN remove artwork", hasPermission("admin", "artwork:remove"));
assert("Admin CAN suspend user", hasPermission("admin", "user:suspend"));
assert("Admin CANNOT change user roles (Super Admin only)", !hasPermission("admin", "user:change_role"));
assert("Super Admin CAN change user roles", hasPermission("super_admin", "user:change_role"));

// 2. Role Hierarchy & Self-Suspension Prevention
console.log("\n✦ SECTION 2: Role Hierarchy & Self-Suspension Guards");
assert("Admin CANNOT suspend themselves", !canModerateTarget("admin", "admin", true).allowed);
assert("Super Admin CANNOT suspend themselves", !canModerateTarget("super_admin", "super_admin", true).allowed);
assert("Moderator CANNOT suspend standard user", !canModerateTarget("moderator", "user", false).allowed);
assert("Admin CAN suspend standard user", canModerateTarget("admin", "user", false).allowed);
assert("Admin CANNOT suspend another Admin (equal rank)", !canModerateTarget("admin", "admin", false).allowed);
assert("Admin CANNOT suspend Super Admin (higher rank)", !canModerateTarget("admin", "super_admin", false).allowed);
assert("Super Admin CAN suspend Admin", canModerateTarget("super_admin", "admin", false).allowed);

// 3. Mass Assignment Prevention
console.log("\n✦ SECTION 3: Mass Assignment Resistance (ASVS V5)");
const maliciousArtworkPayload: any = {
  id: "art_overwritten",
  creatorId: "crt_hacker",
  createdAt: "1970-01-01T00:00:00Z",
  title: "Valid Title",
  price: 500,
  dimensions: "50x50 cm",
  status: "published",
  __proto__: { isAdmin: true },
};
const sanitizedArtwork = filterSafeArtworkUpdates(maliciousArtworkPayload);
assert("Mass assignment stripped 'id'", (sanitizedArtwork as any).id === undefined);
assert("Mass assignment stripped 'creatorId'", (sanitizedArtwork as any).creatorId === undefined);
assert("Mass assignment stripped 'createdAt'", (sanitizedArtwork as any).createdAt === undefined);
assert("Legitimate 'title' preserved", sanitizedArtwork.title === "Valid Title");
assert("Legitimate 'price' preserved", sanitizedArtwork.price === 500);

const maliciousUserPayload: any = {
  id: "usr_hacker",
  role: "super_admin",
  is_admin: true,
  status: "suspended",
  name: "Updated Name",
};
const sanitizedUser = filterSafeUserUpdates(maliciousUserPayload, { allowRoleChange: false });
assert("Mass assignment prevented unauthorized 'role' escalation", sanitizedUser.role === undefined);
assert("Mass assignment stripped arbitrary 'is_admin' field", (sanitizedUser as any).is_admin === undefined);
assert("Legitimate 'name' update accepted", sanitizedUser.name === "Updated Name");
assert("Moderation 'status' update accepted", sanitizedUser.status === "suspended");

// 4. Report State Transition Tampering Resistance
console.log("\n✦ SECTION 4: State Machine Integrity (Illegal Transition Prevention)");
assert("Valid transition: pending -> resolved", isValidReportStateTransition("pending", "resolved").valid);
assert("Valid transition: pending -> dismissed", isValidReportStateTransition("pending", "dismissed").valid);
assert("Illegal replay: resolved -> resolved rejected", !isValidReportStateTransition("resolved", "resolved").valid);
assert("Illegal transition: resolved -> dismissed rejected", !isValidReportStateTransition("resolved", "dismissed").valid);
assert("Illegal transition: dismissed -> resolved rejected", !isValidReportStateTransition("dismissed", "resolved").valid);
assert("Illegal transition: dismissed -> pending rejected", !isValidReportStateTransition("dismissed", "pending").valid);

// 5. Input Validation & SQLi / Malicious Identifier Resistance
console.log("\n✦ SECTION 5: Input Validation & ID Sanitization");
assert("Valid UUID accepted", isValidId("de08f900-66f7-4094-a49c-8c58418c6cf7"));
assert("Valid prefixed ID accepted", isValidId("art_1790682649960_1"));
assert("SQL Injection in ID rejected", !isValidId("art_123'; DROP TABLE artworks; --"));
assert("Path traversal in ID rejected", !isValidId("../../etc/passwd"));
assert("Script tag in ID rejected", !isValidId("<script>alert(1)</script>"));
assert("Valid reason accepted", isValidReportReason("Inappropriate content"));
assert("Arbitrary manipulated reason rejected", !isValidReportReason("Arbitrary Reason Injected By Attacker"));

// 6. Rate Limiting Protection (Anti-Brute Force / Anti-Flood)
console.log("\n✦ SECTION 6: Rate Limiting Enforcement");
const testIp = "test_ip_192_168_1_99";
globalRateLimiter.reset(`login_${testIp}`);

let loginAttempts = 0;
for (let i = 0; i < 5; i++) {
  const res = globalRateLimiter.check(`login_${testIp}`, RATE_LIMIT_CONFIGS.LOGIN.limit, RATE_LIMIT_CONFIGS.LOGIN.windowMs);
  if (res.allowed) loginAttempts++;
}
assert("5 consecutive login attempts permitted", loginAttempts === 5);

const blockedAttempt = globalRateLimiter.check(`login_${testIp}`, RATE_LIMIT_CONFIGS.LOGIN.limit, RATE_LIMIT_CONFIGS.LOGIN.windowMs);
assert("6th login attempt is RATE LIMITED (blocked)", !blockedAttempt.allowed && blockedAttempt.remaining === 0);

console.log("\n========================================================");
console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
console.log("========================================================\n");

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log("✓ ALL PENETRATION RESISTANCE & HARDENING CONTROLS VERIFIED.\n");
}
