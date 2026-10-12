import { localDatabase } from "@/lib/localDatabase";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const configuredUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const configuredKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)?.trim()
  || (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

export const supabaseConfigured = Boolean(configuredUrl && configuredKey
  && !configuredUrl.includes("YOUR_PROJECT_REF") && !configuredKey.includes("YOUR_SUPABASE"));

const url = configuredUrl || "https://YOUR_PROJECT_REF.supabase.co";
const key = configuredKey || "YOUR_SUPABASE_ANON_KEY";

export const localDemoMode = !supabaseConfigured;

export const supabase: SupabaseClient = localDemoMode
  ? localDatabase as unknown as SupabaseClient
  : createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
