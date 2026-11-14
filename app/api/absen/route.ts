import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasServiceRole, MAX_PHOTO_BYTES, PHOTO_BUCKET } from "@/lib/env";
import { nameKey, todayWIB } from "@/lib/format";
import { getProkerContext } from "@/lib/proker-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Attendee = {
  personId: string | null;
  name: string;
  ministryId: string | null;
};

type Payload = {
  clientUuid: string;
  kind?: "piket" | "proker";
  date: string;
  shift: "pagi" | "sore" | null;
  prokerName?: string | null;
  location: string | null;
  notes: string | null;
  submitterName: string;
  consent: boolean;
  website?: string;
  attendees: Attendee[];
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/* In-memory limiter: 6 submissions per 10 minutes per IP.
   Good enough for a single self-hosted instance. */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 6;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5_000) hits.clear();
  return list.length > MAX_PER_WINDOW;
}

function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(`${a}T00:00:00Z`).getTime() -
      new Date(`${b}T00:00:00Z`).getTime()) /
      86_400_000,
  );
}

export async function POST(request: Request) {
  if (!hasServiceRole) {
    return fail("Server belum dikonfigurasi. Hubungi admin.", 503);
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  let payload: Payload;
  let photo: File | null = null;

  try {
    const form = await request.formData();
    const raw = form.get("payload");
    if (typeof raw !== "string") return fail("Data absen tidak valid.");

    payload = JSON.parse(raw) as Payload;
    const file = form.get("photo");
    if (file instanceof File) photo = file;
  } catch {
    return fail("Data absen tidak bisa dibaca.");
  }

  /* ---------- Validation ---------- */

  const kind = payload.kind === "proker" ? "proker" : "piket";
  const isProker = kind === "proker";

  // Public piket form is rate limited; proker needs a signed-in officer.
  if (!isProker && rateLimited(ip)) {
    return fail("Terlalu banyak kiriman. Coba lagi beberapa menit lagi.", 429);
  }

  if (payload.website) return fail("Permintaan ditolak.", 400);
  if (!payload.consent) return fail("Persetujuan foto wajib dicentang.");
  if (!UUID_RE.test(payload.clientUuid ?? ""))
    return fail("ID kiriman tidak valid.");
  if (!DATE_RE.test(payload.date ?? "")) return fail("Tanggal tidak valid.");

  if (!isProker && payload.shift !== "pagi" && payload.shift !== "sore")
    return fail("Shift tidak valid.");

  const today = todayWIB();
  const behind = daysBetween(today, payload.date);
  if (behind < 0) return fail("Tanggal tidak boleh di masa depan.");
  if (behind > 60) return fail("Tanggal terlalu lama. Maksimal 60 hari ke belakang.");

  const prokerName = isProker
    ? String(payload.prokerName ?? "").trim().replace(/\s+/g, " ")
    : null;
  if (isProker && (!prokerName || prokerName.length < 3 || prokerName.length > 120))
    return fail("Nama proker tidak valid.");
  const prokerKey = prokerName ? nameKey(prokerName) : null;

  let submitterName = String(payload.submitterName ?? "").trim();
  let submitterUserId: string | null = null;
  let submitterMinistryId: string | null = null;

  if (isProker) {
    const ctx = await getProkerContext();
    if (ctx.mode === "anonymous") {
      return fail("Masuk dulu untuk mengisi absen proker.", 401);
    }
    if (ctx.mode === "unconfigured") {
      return fail("Database belum siap. Jalankan schema.sql lalu coba lagi.", 503);
    }
    if (ctx.mode !== "officer" && ctx.mode !== "demo") {
      return fail("Akun ini bukan menteri atau wakil menteri.", 403);
    }
    submitterName = ctx.officer.name;
    submitterUserId = ctx.officer.userId;
    submitterMinistryId = ctx.officer.ministryId;
  }

  if (!Array.isArray(payload.attendees) || payload.attendees.length === 0)
    return fail(
      isProker ? "Isi minimal satu nama yang hadir." : "Isi minimal satu nama yang piket.",
    );
  if (payload.attendees.length > 60)
    return fail("Maksimal 60 nama per sesi.");
  // Piket: satu orang satu absen, tidak bisa mengabsenkan orang lain.
  if (!isProker && payload.attendees.length !== 1)
    return fail("Absen piket hanya untuk satu orang.");

  if (!photo) return fail("Foto bukti wajib dilampirkan.");
  if (photo.size > MAX_PHOTO_BYTES) return fail("Ukuran foto terlalu besar.");
  if (!photo.type.startsWith("image/"))
    return fail("File bukti harus berupa gambar.");

  /* ---------- Normalise attendees ---------- */

  const cleaned: Array<{ name: string; key: string; ministryId: string; personId: string | null }> = [];
  const seen = new Set<string>();

  for (const attendee of payload.attendees) {
    const name = String(attendee?.name ?? "").trim().replace(/\s+/g, " ");
    if (!name) continue;
    if (name.length > 120) return fail("Nama terlalu panjang.");
    const key = nameKey(name);
    if (seen.has(key)) continue;
    seen.add(key);

    const ministryId = String(attendee?.ministryId ?? "");
    if (!UUID_RE.test(ministryId))
      return fail(`Kementerian untuk "${name}" belum dipilih.`);

    const personId =
      attendee?.personId && UUID_RE.test(attendee.personId)
        ? attendee.personId
        : null;

    cleaned.push({ name, key, ministryId, personId });
  }

  if (!cleaned.length)
    return fail(
      isProker ? "Isi minimal satu nama yang hadir." : "Isi minimal satu nama yang piket.",
    );

  if (!isProker) {
    // The person absent-ing is the submitter; client-sent submitterName is ignored.
    submitterName = cleaned[0].name;
    if (submitterName.length < 2) return fail("Nama tidak valid.");
  }

  const db = createSupabaseAdminClient();

  try {
    /* ---------- Idempotency: same client_uuid = same submission ---------- */
    const { data: existingByUuid } = await db
      .from("submissions")
      .select("id")
      .eq("client_uuid", payload.clientUuid)
      .maybeSingle();

    if (existingByUuid) {
      return NextResponse.json({
        ok: true,
        already: true,
        merged: false,
        count: cleaned.length,
        names: cleaned.map((c) => c.name),
      });
    }

    /* ---------- Ministries must exist and be active ---------- */
    const { data: ministries } = await db
      .from("ministries")
      .select("id")
      .eq("is_active", true);
    const validMinistries = new Set((ministries ?? []).map((m) => m.id));
    for (const attendee of cleaned) {
      if (!validMinistries.has(attendee.ministryId)) {
        return fail(`Kementerian untuk "${attendee.name}" tidak dikenal.`);
      }
    }

    /* ---------- Session: find or create ---------- */
    let sessionId: string | null = null;
    let merged = false;

    const findSession = () => {
      let query = db
        .from("sessions")
        .select("id, deleted_at")
        .eq("date", payload.date);

      query = isProker
        ? query.eq("kind", "proker").eq("proker_key", prokerKey as string)
        : query.eq("kind", "piket").eq("shift", payload.shift as string);

      return query.maybeSingle();
    };

    const { data: found } = await findSession();

    if (found) {
      sessionId = found.id;
      merged = true;

      // Admin hid this session earlier; new evidence brings it back.
      if (found.deleted_at) {
        await db
          .from("sessions")
          .update({ deleted_at: null })
          .eq("id", found.id);
      }
    } else {
      const { data: inserted, error: insertError } = await db
        .from("sessions")
        .insert({
          kind,
          date: payload.date,
          shift: isProker ? null : payload.shift,
          proker_name: prokerName,
          proker_key: prokerKey,
          location: payload.location?.trim() || null,
          notes: payload.notes?.trim() || null,
        })
        .select("id")
        .single();

      if (insertError) {
        // Lost a race with another submitter: reuse the session they created.
        const { data: retry } = await findSession();
        if (!retry) throw insertError;
        sessionId = retry.id;
        merged = true;
      } else {
        sessionId = inserted.id;
      }
    }

    if (!sessionId) throw new Error("Sesi tidak bisa dibuat.");

    /* ---------- Resolve people (roster match or pending new person) ---------- */
    const { data: roster } = await db
      .from("people")
      .select("id, full_name, name_key, ministry_id, is_active");
    const byKey = new Map(
      (roster ?? []).map((p) => [p.name_key as string, p]),
    );
    const activeIds = new Set(
      (roster ?? []).filter((p) => p.is_active).map((p) => p.id),
    );

    const resolved: Array<{ personId: string; ministryId: string }> = [];

    for (const attendee of cleaned) {
      let personId = attendee.personId;

      if (personId && activeIds.has(personId)) {
        // roster match supplied by the client
      } else {
        const match = byKey.get(attendee.key);
        if (match) {
          personId = match.id;
        } else {
          const { data: createdPerson, error: personError } = await db
            .from("people")
            .insert({
              full_name: attendee.name,
              name_key: attendee.key,
              ministry_id: attendee.ministryId,
              source: "pending",
            })
            .select("id")
            .single();

          if (personError) {
            const { data: retryPerson } = await db
              .from("people")
              .select("id")
              .eq("name_key", attendee.key)
              .maybeSingle();
            if (!retryPerson) throw personError;
            personId = retryPerson.id;
          } else {
            personId = createdPerson.id;
            byKey.set(attendee.key, {
              id: createdPerson.id,
              full_name: attendee.name,
              name_key: attendee.key,
              ministry_id: attendee.ministryId,
              is_active: true,
            });
          }
        }
      }

      if (!personId) throw new Error(`Gagal mencatat "${attendee.name}".`);
      resolved.push({ personId, ministryId: attendee.ministryId });
    }

    /* ---------- Upload proof photo ---------- */
    const month = payload.date.slice(0, 7);
    const path = `${month}/${payload.date}_${kind}_${payload.clientUuid}.jpg`;
    const buffer = new Uint8Array(await photo.arrayBuffer());

    const { error: uploadError } = await db.storage
      .from(PHOTO_BUCKET)
      .upload(path, buffer, { contentType: "image/jpeg", upsert: false });

    if (uploadError) {
      const missingBucket = /bucket/i.test(uploadError.message);
      return fail(
        missingBucket
          ? "Bucket foto belum dibuat. Jalankan supabase/schema.sql."
          : "Gagal mengunggah foto. Coba lagi.",
        500,
      );
    }

    /* ---------- Write attendance + submission ---------- */
    try {
      const rows = resolved.map((r) => ({
        session_id: sessionId,
        person_id: r.personId,
        ministry_id: r.ministryId,
      }));

      const { error: attendanceError } = await db
        .from("session_people")
        .upsert(rows, {
          onConflict: "session_id,person_id",
          ignoreDuplicates: true,
        });
      if (attendanceError) throw attendanceError;

      const { error: submissionError } = await db
        .from("submissions")
        .insert({
          client_uuid: payload.clientUuid,
          session_id: sessionId,
          submitter_name: submitterName,
          submitter_user_id: submitterUserId,
          submitter_ministry_id: submitterMinistryId,
          photo_path: path,
          note: payload.notes?.trim() || null,
          ip,
          user_agent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
        });

      if (submissionError) {
        // Lost a race with the same person's retry: keep the earlier row.
        if (submissionError.code === "23505") {
          await db.storage.from(PHOTO_BUCKET).remove([path]);
          return NextResponse.json({
            ok: true,
            already: true,
            merged,
            count: resolved.length,
            names: cleaned.map((c) => c.name),
          });
        }
        throw submissionError;
      }
    } catch (writeError) {
      await db.storage.from(PHOTO_BUCKET).remove([path]);
      throw writeError;
    }

    return NextResponse.json({
      ok: true,
      already: false,
      merged,
      count: resolved.length,
      names: cleaned.map((c) => c.name),
    });
  } catch (error) {
    console.error("[absen] gagal menyimpan:", error);
    return fail(
      "Gagal menyimpan absen. Isianmu tersimpan di perangkat ini — coba kirim lagi.",
      500,
    );
  }
}
