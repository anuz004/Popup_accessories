import { createClient } from "@supabase/supabase-js";

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || "https://YOUR_PROJECT_REF.supabase.co";
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || "YOUR_SUPABASE_ANON_KEY";

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
