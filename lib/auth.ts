import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { AdminUser } from "./types";
import { AppRole, Permission, hasPermission, isAdminOrModerator } from "./security/rbac";

export const AUTH_COOKIE_NAME = "erasstudio_admin_session";

export const DEFAULT_ADMIN: AdminUser = {
  id: "adm_01",
  name: "Elena Vance",
  email: "elena@erasstudio.com",
  role: "super_admin",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
  lastLoginAt: "Active Session",
};

export interface SessionPayload {
  id: string;
  username: string;
  role: AppRole;
  name: string;
  email: string;
  [key: string]: unknown;
}

export const COOKIE_OPTIONS = {
  name: AUTH_COOKIE_NAME,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

/**
 * Encodes the session secret key for HS256 JWT signing and verification.
 * In production, enforces presence of a strong secret (min 32 chars).
 */
function getSessionSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;

  if (process.env.NODE_ENV === "production") {
    if (!secret || secret.length < 32) {
      throw new Error(
        "CRITICAL SECURITY CONFIGURATION ERROR: SESSION_SECRET must be configured with at least 32 characters in production."
      );
    }
    return new TextEncoder().encode(secret);
  }

  // Development fallback with explicit security warning
  if (!secret) {
    console.warn(
      "[SECURITY WARNING] SESSION_SECRET is not set in development. Using dev fallback key. Set SESSION_SECRET in .env.local for production."
    );
  }

  return new TextEncoder().encode(secret || "erasstudio_fallback_session_secret_min_32_chars_long");
}

/**
 * Validates user credentials against server-side configuration.
 */
export async function verifyCredentials(
  username: string,
  password: string
): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
  const validUsername = process.env.ADMIN_USERNAME;
  const validPassword = process.env.ADMIN_PASSWORD;

  if (!validUsername || !validPassword) {
    return {
      success: false,
      error: "Authentication service not properly configured in environment.",
    };
  }

  const cleanUser = username?.trim();
  const cleanPass = password?.trim();

  // Timing-safe constant-length comparison could be used, or basic strict equality
  if (cleanUser === validUsername && cleanPass === validPassword) {
    return {
      success: true,
      user: {
        ...DEFAULT_ADMIN,
        name: "Studio Administrator",
        email: `${cleanUser}@erasstudio.com`,
      },
    };
  }

  return {
    success: false,
    error: "Invalid username or password.",
  };
}

/**
 * Creates and signs an encrypted/tamper-proof JWT session token.
 */
export async function createSessionToken(
  payload: {
    username: string;
    role: AppRole;
    name: string;
    email: string;
    id?: string;
    [key: string]: unknown;
  }
): Promise<string> {
  const secret = getSessionSecret();
  const fullPayload: SessionPayload = {
    id: payload.id || "adm_01",
    username: payload.username,
    role: payload.role,
    name: payload.name,
    email: payload.email,
  };

  return new SignJWT({ ...fullPayload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

/**
 * Verifies a JWT session token and returns the typed payload if valid.
 * Edge-compatible (middleware) and Node.js-compatible.
 */
export async function verifySessionToken(
  token: string | undefined | null
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const secret = getSessionSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Centralized Server-Side Admin Authorization Guard
 * Use in Server Actions and Route Handlers.
 */
export async function requireAdminSession(requiredPermission?: Permission): Promise<SessionPayload> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  if (!session) {
    throw new Error("Unauthorized: Valid administrative session is required.");
  }

  if (!isAdminOrModerator(session.role)) {
    throw new Error("Forbidden: Account does not possess administrative privileges.");
  }

  if (requiredPermission && !hasPermission(session.role, requiredPermission)) {
    throw new Error(`Forbidden: Insufficient privileges for action '${requiredPermission}'.`);
  }

  return session;
}
