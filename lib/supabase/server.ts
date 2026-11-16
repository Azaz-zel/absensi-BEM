import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";
import { AUTH_COOKIE_OPTIONS } from "@/lib/supabase/cookie";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * Supabase client bound to the admin's auth cookies.
 * Never use this for public submissions — it inherits the anon role.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookieOptions: AUTH_COOKIE_OPTIONS,
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet: CookieToSet[]) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, { ...AUTH_COOKIE_OPTIONS, ...options }),
          );
        } catch {
          // Called from a Server Component render: safe to ignore.
        }
      },
    },
  });
}
