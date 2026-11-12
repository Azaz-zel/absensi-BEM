import { createClient } from "@supabase/supabase-js";
import {
  SUPABASE_SERVICE_KEY,
  SUPABASE_URL,
  hasServiceRole,
} from "@/lib/env";

/**
 * Service-role client. Bypasses RLS.
 * Only import from Route Handlers, Server Actions, or Server Components.
 */
export function createSupabaseAdminClient() {
  if (!hasServiceRole) {
    throw new Error(
      "Supabase belum dikonfigurasi: NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi.",
    );
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
