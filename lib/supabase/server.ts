import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Checks whether Supabase environment variables are properly configured.
 */
export function isSupabaseConfigured(): boolean {
  if (!supabaseUrl) return false;
  if (supabaseUrl.includes("your_supabase") || supabaseUrl.includes("your-project")) return false;
  return Boolean(supabaseServiceRoleKey || supabaseAnonKey);
}

let serverClientInstance: SupabaseClient<Database> | null = null;

/**
 * Server-side Supabase client for Server Components, Server Actions, and Repositories.
 * Uses the Service Role Key if available (bypasses RLS for full admin control),
 * or falls back to Anon Key.
 */
export function getSupabaseAdmin(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (serverClientInstance) {
    return serverClientInstance;
  }

  const key = supabaseServiceRoleKey || supabaseAnonKey;
  if (!key || !supabaseUrl) {
    return null;
  }

  serverClientInstance = createClient<Database>(supabaseUrl, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      fetch: (url, options = {}) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        return fetch(url, {
          ...options,
          signal: options.signal || controller.signal,
        }).finally(() => clearTimeout(timeout));
      },
    },
  });

  return serverClientInstance;
}
