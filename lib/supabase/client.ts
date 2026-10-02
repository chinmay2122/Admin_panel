import { createClient } from "@supabase/supabase-js";
import { Database } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isBrowserSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes("your-project"));

/**
 * Browser-side Supabase client.
 * Safe to use in React Client Components ('use client').
 */
export const supabase = isBrowserSupabaseConfigured
  ? createClient<Database>(supabaseUrl!, supabaseAnonKey!)
  : null;
