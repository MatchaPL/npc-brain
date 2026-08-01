import { createClient } from "@supabase/supabase-js";

// Fall back to placeholders so the module loads even when Supabase isn't configured
// yet (e.g. World-knowledge mode needs no DB). Actual queries then fail with a clear
// error instead of crashing the whole API route at import time.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
// Prefer the service_role key on the server (needed for RPC + writes with RLS on).
// Falls back to the anon key if service role is not set.
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "placeholder-key";

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});
