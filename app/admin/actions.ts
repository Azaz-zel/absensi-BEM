"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { nameKey } from "@/lib/format";

function text(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function refresh(sessionId?: string) {
  revalidateTag("roster");
  revalidatePath("/admin");
  revalidatePath("/admin/sesi");
  revalidatePath("/admin/orang");
  revalidatePath("/admin/kementerian");
  if (sessionId) revalidatePath(`/admin/sesi/${sessionId}`);
}

export async function verifySession(form: FormData) {
  const { userId } = await requireAdmin();
  const id = text(form, "id");
  const verified = text(form, "verified") === "1";
  if (!id) return;

  const db = createSupabaseAdminClient();
  await db
    .from("sessions")
    .update({
      status: verified ? "verified" : "self_reported",
      verified_at: verified ? new Date().toISOString() : null,
      verified_by: verified ? userId : null,
    })
    .eq("id", id);

  await db
    .from("submissions")
    .update({ status: verified ? "verified" : "self_reported" })
    .eq("session_id", id);

  refresh(id);
}

export async function deleteSession(form: FormData) {
  await requireAdmin();
  const id = text(form, "id");
  if (!id) return;

  const db = createSupabaseAdminClient();
  await db
    .from("sessions")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/admin");
  revalidatePath("/admin/sesi");
}

export async function createPerson(form: FormData) {
  await requireAdmin();
  const fullName = text(form, "full_name").replace(/\s+/g, " ");
  const nim = text(form, "nim") || null;
  const ministryId = text(form, "ministry_id") || null;
  if (fullName.length < 2) return;

  const db = createSupabaseAdminClient();
  const key = nameKey(fullName);

  // name_key is unique: adding an existing person would otherwise throw.
  const { data: existing } = await db
    .from("people")
    .select("id")
    .eq("name_key", key)
    .maybeSingle();
  if (existing) return;

  await db.from("people").insert({
    full_name: fullName,
    name_key: key,
    nim,
    ministry_id: ministryId,
    source: "admin",
  });

  refresh();
}

export async function updatePerson(form: FormData) {
  await requireAdmin();
  const id = text(form, "id");
  const fullName = text(form, "full_name").replace(/\s+/g, " ");
  const nim = text(form, "nim") || null;
  const ministryId = text(form, "ministry_id") || null;
  const active = text(form, "is_active") === "1";
  if (!id || fullName.length < 2) return;

  const db = createSupabaseAdminClient();
  const key = nameKey(fullName);

  const { data: clash } = await db
    .from("people")
    .select("id")
    .eq("name_key", key)
    .maybeSingle();
  if (clash && clash.id !== id) return;

  await db
    .from("people")
    .update({
      full_name: fullName,
      name_key: key,
      nim,
      ministry_id: ministryId,
      is_active: active,
    })
    .eq("id", id);

  refresh();
}

export async function approvePendingPerson(form: FormData) {
  await requireAdmin();
  const id = text(form, "id");
  const ministryId = text(form, "ministry_id") || null;
  if (!id) return;

  const db = createSupabaseAdminClient();
  await db
    .from("people")
    .update({ source: "admin", ministry_id: ministryId })
    .eq("id", id);

  refresh();
}

export async function mergePeople(form: FormData) {
  await requireAdmin();
  const sourceId = text(form, "source_id");
  const targetId = text(form, "target_id");
  if (!sourceId || !targetId || sourceId === targetId) return;

  const db = createSupabaseAdminClient();

  const { data: rows } = await db
    .from("session_people")
    .select("session_id, ministry_id")
    .eq("person_id", sourceId);

  for (const row of rows ?? []) {
    await db.from("session_people").upsert(
      {
        session_id: row.session_id,
        person_id: targetId,
        ministry_id: row.ministry_id,
      },
      { onConflict: "session_id,person_id", ignoreDuplicates: true },
    );
  }

  await db.from("session_people").delete().eq("person_id", sourceId);
  await db.from("people").update({ is_active: false }).eq("id", sourceId);

  refresh();
}

export async function createMinistry(form: FormData) {
  await requireAdmin();
  const name = text(form, "name").replace(/\s+/g, " ");
  const sortOrder = Number(text(form, "sort_order")) || 99;
  if (name.length < 3) return;

  const db = createSupabaseAdminClient();

  const { data: existing } = await db
    .from("ministries")
    .select("id")
    .eq("name", name)
    .maybeSingle();
  if (existing) return;

  await db
    .from("ministries")
    .insert({ name, sort_order: sortOrder, is_active: true });

  refresh();
}

export async function updateMinistry(form: FormData) {
  await requireAdmin();
  const id = text(form, "id");
  const name = text(form, "name").replace(/\s+/g, " ");
  const sortOrder = Number(text(form, "sort_order")) || 99;
  const active = text(form, "is_active") === "1";
  if (!id || name.length < 3) return;

  const db = createSupabaseAdminClient();

  const { data: clash } = await db
    .from("ministries")
    .select("id")
    .eq("name", name)
    .maybeSingle();
  if (clash && clash.id !== id) return;

  await db
    .from("ministries")
    .update({ name, sort_order: sortOrder, is_active: active })
    .eq("id", id);

  refresh();
}
