import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEMO_MODE, isSupabaseConfigured } from "@/lib/env";

export type AdminContext =
  | { mode: "demo" }
  | { mode: "anonymous" }
  | { mode: "unauthorized"; email: string | null }
  | { mode: "admin"; userId: string; email: string | null; role: string };

export async function getAdminContext(): Promise<AdminContext> {
  // Sample data is opt-in. Without DEMO_MODE the panel stays locked, even
  // when no Supabase project exists yet.
  if (DEMO_MODE && !isSupabaseConfigured) return { mode: "demo" };
  if (!isSupabaseConfigured) return { mode: "anonymous" };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { mode: "anonymous" };

  const { data } = await supabase
    .from("admins")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) return { mode: "unauthorized", email: user.email ?? null };

  return {
    mode: "admin",
    userId: user.id,
    email: user.email ?? null,
    role: data.role ?? "admin",
  };
}

/** Throws unless the caller is a signed-in, whitelisted admin. */
export async function requireAdmin(): Promise<{ userId: string }> {
  const ctx = await getAdminContext();
  if (ctx.mode !== "admin") {
    throw new Error("Tidak punya akses admin.");
  }
  return { userId: ctx.userId };
}
