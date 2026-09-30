import { SignJWT, jwtVerify } from "jose";
import { AdminUser } from "./types";

export const AUTH_COOKIE_NAME = "iras_admin_session";

export const DEFAULT_ADMIN: AdminUser = {
  id: "adm_01",
  name: "Elena Vance",
  email: "elena@iras.studio",
  role: "super_admin",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
  lastLoginAt: "Active Session",
};

export interface SessionPayload {
  username: string;
  role: string;
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
 */
function getSessionSecret(): Uint8Array {
  const secret =
    process.env.SESSION_SECRET ||
    "iras_studio_fallback_session_secret_min_32_chars_long";
  return new TextEncoder().encode(secret);
}

/**
 * Validates user credentials.
 *
 * NOTE FOR SUPABASE MIGRATION:
 * When migrating to Supabase Auth:
 * 1. Call supabase.auth.signInWithPassword({ email, password })
 * 2. Query user profile/metadata to verify `role === "admin"` or `app_metadata.role === "admin"`
 * 3. Return session/user payload or throw unauthorized error
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

  if (cleanUser === validUsername && cleanPass === validPassword) {
    return {
      success: true,
      user: {
        ...DEFAULT_ADMIN,
        name: "Studio Administrator",
        email: `${cleanUser}@iras.studio`,
      },
    };
  }

  return {
    success: false,
    error: "Invalid username or password.",
  };
}

/**
 * Creates and signs a JWT session token.
 */
export async function createSessionToken(
  payload: SessionPayload
): Promise<string> {
  const secret = getSessionSecret();
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

/**
 * Verifies a JWT session token and returns the payload if valid.
 * Compatible with Edge runtime (middleware) and Node.js runtime.
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
