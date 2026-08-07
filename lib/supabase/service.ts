import { createClient } from "@supabase/supabase-js";

// Service-role client — bypasses RLS. Only for server contexts with no
// user session to scope to, like the Phase 8 health webhook, which
// receives POSTs from Health Auto Export rather than an authenticated
// browser request. Never import this into client code.
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
