import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEMO_MODE, hasServiceRole } from "@/lib/env";
import { DEMO_MINISTRIES } from "@/lib/demo-roster";
import type { ProkerOfficer } from "@/lib/types";

export type ProkerContext =
  | { mode: "demo"; officer: ProkerOfficer }
  | { mode: "anonymous" }
  | { mode: "unauthorized"; email: string | null }
  | { mode: "unconfigured" }
  | { mode: "officer"; officer: ProkerOfficer };

const DEMO_OFFICER: ProkerOfficer = {
  userId: "demo-officer",
  name: "Menteri Demo",
  email: null,
  ministryId: DEMO_MINISTRIES[0]?.id ?? "",
  ministryName: DEMO_MINISTRIES[0]?.name ?? null,
  role: "menteri",
};

export function officerRoleLabel(role: ProkerOfficer["role"]): string {
  if (role === "admin") return "Admin";
  return role === "wakil_menteri" ? "Wakil Menteri" : "Menteri";
}

/**
 * Who is filling the proker form. Anonymous visitors are sent to the login
 * page; signed-in accounts that are neither registered officers nor admins
 * get an explicit "belum diizinkan" screen instead of the form.
 */
export async function getProkerContext(): Promise<ProkerContext> {
  if (!hasServiceRole) {
    return DEMO_MODE
      ? { mode: "demo", officer: DEMO_OFFICER }
      : { mode: "unconfigured" };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { mode: "anonymous" };

  const db = createSupabaseAdminClient();
  const { data, error } = await db
    .from("proker_officers")
    .select("user_id, email, full_name, ministry_id, role, ministries(name)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    // Schema belum dimigrasi: jangan tampilkan form yang pasti gagal.
    if (/proker_officers/i.test(error.message)) {
      return { mode: "unconfigured" };
    }
    return { mode: "unauthorized", email: user.email ?? null };
  }

  if (!data) {
    // Admin panel accounts may also fill proker absen, for any ministry.
    const { data: admin } = await db
      .from("admins")
      .select("user_id, email, role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (admin) {
      const email = (admin.email as string | null) ?? user.email ?? null;
      return {
        mode: "officer",
        officer: {
          userId: user.id,
          name: email ?? "Admin",
          email,
          ministryId: null,
          ministryName: null,
          role: "admin",
        },
      };
    }

    return { mode: "unauthorized", email: user.email ?? null };
  }

  return {
    mode: "officer",
    officer: {
      userId: data.user_id as string,
      name: data.full_name as string,
      email: (data.email as string | null) ?? user.email ?? null,
      ministryId: data.ministry_id as string,
      ministryName:
        (data.ministries as unknown as { name: string } | null)?.name ?? null,
      role: data.role === "wakil_menteri" ? "wakil_menteri" : "menteri",
    },
  };
}
