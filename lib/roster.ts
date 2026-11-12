import { unstable_cache } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { addDays, nameKey, todayWIB } from "@/lib/format";
import { PHOTO_BUCKET } from "@/lib/env";
import type {
  DashboardData,
  DayCount,
  Ministry,
  MinistryRank,
  Person,
  PersonRank,
  SessionKind,
  SessionRow,
  SessionStatus,
  Shift,
} from "@/lib/types";

export type Period = {
  from: string;
  to: string;
  shift?: Shift | "all";
  kind?: SessionKind | "all";
};

export function defaultPeriod(days = 30): Period {
  const to = todayWIB();
  return { from: addDays(to, -(days - 1)), to };
}

type DbSession = {
  id: string;
  kind: SessionKind;
  date: string;
  shift: Shift | null;
  proker_name: string | null;
  location: string | null;
  notes: string | null;
  status: SessionStatus;
  created_at: string;
};

type DbAttendance = {
  session_id: string;
  person_id: string;
  ministry_id: string;
  people: { full_name: string } | null;
  ministries: { name: string } | null;
};

export async function getRoster(): Promise<{
  ministries: Ministry[];
  people: Person[];
}> {
  return cachedRoster();
}

const cachedRoster = unstable_cache(
  async (): Promise<{
    ministries: Ministry[];
    people: Person[];
  }> => {
    const db = createSupabaseAdminClient();

    const [{ data: ministries }, { data: people }] = await Promise.all([
      db
        .from("ministries")
        .select("id, name, sort_order, is_active")
        .eq("is_active", true)
        .order("sort_order"),
      db
        .from("people")
        .select("id, full_name, nim, ministry_id, source, is_active")
        .eq("is_active", true)
        .order("full_name"),
    ]);

    return {
      ministries: (ministries ?? []) as Ministry[],
      people: (people ?? []) as Person[],
    };
  },
  ["roster"],
  // The roster changes rarely; admin mutations revalidate the tag.
  { revalidate: 60, tags: ["roster"] },
);

export async function getAllMinistries(): Promise<Ministry[]> {
  const db = createSupabaseAdminClient();
  const { data } = await db
    .from("ministries")
    .select("id, name, sort_order, is_active")
    .order("sort_order");
  return (data ?? []) as Ministry[];
}

export async function getAllPeople(): Promise<Person[]> {
  const db = createSupabaseAdminClient();
  const { data } = await db
    .from("people")
    .select("id, full_name, nim, ministry_id, source, is_active")
    .order("full_name");
  return (data ?? []) as Person[];
}

export async function getDashboardData(period: Period): Promise<DashboardData> {
  const db = createSupabaseAdminClient();

  let query = db
    .from("sessions")
    .select(
      "id, kind, date, shift, proker_name, location, notes, status, created_at",
    )
    .is("deleted_at", null)
    .gte("date", period.from)
    .lte("date", period.to)
    .order("date", { ascending: false });

  if (period.kind && period.kind !== "all") {
    query = query.eq("kind", period.kind);
  }

  if (period.shift && period.shift !== "all" && period.kind !== "proker") {
    query = query.eq("shift", period.shift);
  }

  const { data: sessionsData } = await query;
  const sessions = (sessionsData ?? []) as DbSession[];
  const ids = sessions.map((s) => s.id);

  const [attendanceRes, peopleRes, submissionsRes] = await Promise.all([
    ids.length
      ? db
          .from("session_people")
          .select(
            "session_id, person_id, ministry_id, people(full_name), ministries(name)",
          )
          .in("session_id", ids)
      : Promise.resolve({ data: [] as DbAttendance[] }),
    db.from("people").select("id", { count: "exact", head: true }),
    ids.length
      ? db
          .from("submissions")
          .select("id, session_id, submitter_name, photo_path, created_at, status")
          .in("session_id", ids)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as SubmissionLite[] }),
  ]);

  const attendance = (attendanceRes.data ?? []) as unknown as DbAttendance[];
  const submissions = (submissionsRes.data ?? []) as SubmissionLite[];

  const peopleCount = new Map<string, { name: string; ministry: string | null; count: number }>();
  const ministryCount = new Map<string, { name: string; count: number }>();

  for (const row of attendance) {
    const person = peopleCount.get(row.person_id);
    if (person) person.count += 1;
    else
      peopleCount.set(row.person_id, {
        name: row.people?.full_name ?? "Tidak dikenal",
        ministry: row.ministries?.name ?? null,
        count: 1,
      });

    const ministry = ministryCount.get(row.ministry_id);
    if (ministry) ministry.count += 1;
    else
      ministryCount.set(row.ministry_id, {
        name: row.ministries?.name ?? "Tidak dikenal",
        count: 1,
      });
  }

  const topPeople: PersonRank[] = [...peopleCount.entries()]
    .map(([id, v]) => ({ person_id: id, ...v }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  const topMinistries: MinistryRank[] = [...ministryCount.entries()]
    .map(([id, v]) => ({ ministry_id: id, ...v }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  const perDay = new Map<string, number>();
  for (const row of attendance) {
    const session = sessions.find((s) => s.id === row.session_id);
    if (!session) continue;
    perDay.set(session.date, (perDay.get(session.date) ?? 0) + 1);
  }

  const daily: DayCount[] = [...perDay.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const photoBySession = new Map<string, string>();
  for (const sub of submissions) {
    if (sub.photo_path && !photoBySession.has(sub.session_id)) {
      photoBySession.set(sub.session_id, sub.photo_path);
    }
  }

  const membersBySession = new Map<string, DbAttendance[]>();
  for (const row of attendance) {
    const list = membersBySession.get(row.session_id) ?? [];
    list.push(row);
    membersBySession.set(row.session_id, list);
  }

  const recent: SessionRow[] = sessions.slice(0, 8).map((s) => ({
    id: s.id,
    kind: s.kind,
    date: s.date,
    shift: s.shift,
    proker_name: s.proker_name,
    location: s.location,
    notes: s.notes,
    status: s.status,
    created_at: s.created_at,
    people_count: membersBySession.get(s.id)?.length ?? 0,
    photo_path: photoBySession.get(s.id) ?? null,
    ministries: [
      ...new Set(
        (membersBySession.get(s.id) ?? [])
          .map((r) => r.ministries?.name)
          .filter((n): n is string => Boolean(n)),
      ),
    ],
  }));

  return {
    totalSessions: sessions.length,
    totalAttendance: attendance.length,
    totalPeople: peopleRes.count ?? 0,
    verifiedSessions: sessions.filter((s) => s.status === "verified").length,
    topPeople,
    topMinistries,
    daily,
    recent,
    demo: false,
  };
}

type SubmissionLite = {
  id: string;
  session_id: string;
  submitter_name: string;
  photo_path: string | null;
  created_at: string;
  status: SessionStatus;
};

export async function getSessions(
  period: Period,
  options: { search?: string; limit?: number } = {},
): Promise<SessionRow[]> {
  const db = createSupabaseAdminClient();

  let query = db
    .from("sessions")
    .select(
      "id, kind, date, shift, proker_name, location, notes, status, created_at, session_people(person_id, people(full_name), ministries(name)), submissions(photo_path, submitter_name)",
    )
    .is("deleted_at", null)
    .gte("date", period.from)
    .lte("date", period.to)
    .order("date", { ascending: false })
    .order("shift", { ascending: true })
    .limit(options.limit ?? 300);

  if (period.kind && period.kind !== "all") {
    query = query.eq("kind", period.kind);
  }

  if (period.shift && period.shift !== "all" && period.kind !== "proker") {
    query = query.eq("shift", period.shift);
  }

  const { data } = await query;

  type Nested = DbSession & {
    session_people: Array<{
      person_id: string;
      people: { full_name: string } | null;
      ministries: { name: string } | null;
    }>;
    submissions: Array<{ photo_path: string | null; submitter_name: string }>;
  };

  let rows = (data ?? []) as unknown as Nested[];

  if (options.search?.trim()) {
    const q = nameKey(options.search);
    rows = rows.filter((s) =>
      s.session_people.some((p) =>
        (p.people?.full_name ?? "").toLowerCase().includes(q),
      ),
    );
  }

  return rows.map((s) => ({
    id: s.id,
    kind: s.kind,
    date: s.date,
    shift: s.shift,
    proker_name: s.proker_name,
    location: s.location,
    notes: s.notes,
    status: s.status,
    created_at: s.created_at,
    people_count: s.session_people.length,
    submitters: [...new Set(s.submissions.map((sub) => sub.submitter_name))],
    photo_path:
      s.submissions.find((sub) => sub.photo_path)?.photo_path ?? null,
    ministries: [
      ...new Set(
        s.session_people
          .map((p) => p.ministries?.name)
          .filter((n): n is string => Boolean(n)),
      ),
    ],
  }));
}

export async function getSessionDetail(id: string) {
  const db = createSupabaseAdminClient();

  const [{ data: session }, { data: attendance }, { data: submissions }] =
    await Promise.all([
      db
        .from("sessions")
        .select("id, kind, date, shift, proker_name, location, notes, status, created_at")
        .eq("id", id)
        .is("deleted_at", null)
        .maybeSingle(),
      db
        .from("session_people")
        .select(
          "person_id, ministry_id, people(id, full_name, nim), ministries(id, name, sort_order)",
        )
        .eq("session_id", id),
      db
        .from("submissions")
        .select(
          "id, submitter_name, photo_path, note, created_at, status",
        )
        .eq("session_id", id)
        .order("created_at"),
    ]);

  if (!session) return null;

  type Attendance = {
    person_id: string;
    ministry_id: string;
    people: { id: string; full_name: string; nim: string | null } | null;
    ministries: { id: string; name: string; sort_order: number } | null;
  };

  const rows = (attendance ?? []) as unknown as Attendance[];
  const subs = (submissions ?? []) as Array<{
    id: string;
    submitter_name: string;
    photo_path: string | null;
    note: string | null;
    created_at: string;
    status: SessionStatus;
  }>;

  const paths = subs.map((s) => s.photo_path).filter((p): p is string => Boolean(p));
  const signed = paths.length
    ? await db.storage.from(PHOTO_BUCKET).createSignedUrls(paths, 60 * 60)
    : { data: [] as Array<{ path: string; signedUrl: string }> };

  const urlByPath = new Map(
    (signed.data ?? []).map((s) => [s.path, s.signedUrl]),
  );

  return {
    session: session as DbSession,
    attendees: rows
      .map((r) => ({
        personId: r.person_id,
        name: r.people?.full_name ?? "Tidak dikenal",
        nim: r.people?.nim ?? null,
        ministry: r.ministries?.name ?? "Tanpa kementerian",
        ministrySort: r.ministries?.sort_order ?? 99,
      }))
      .sort((a, b) => a.ministrySort - b.ministrySort || a.name.localeCompare(b.name)),
    submissions: subs.map((s) => ({
      ...s,
      photoUrl: s.photo_path ? urlByPath.get(s.photo_path) ?? null : null,
    })),
    ministries: [
      ...new Set(rows.map((r) => r.ministries?.name ?? "Tanpa kementerian")),
    ],
  };
}

export async function signedUrlsFor(
  paths: string[],
): Promise<Record<string, string>> {
  if (!paths.length) return {};
  const db = createSupabaseAdminClient();
  const { data } = await db.storage
    .from(PHOTO_BUCKET)
    .createSignedUrls(paths, 60 * 60);
  const map: Record<string, string> = {};
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) map[item.path] = item.signedUrl;
  }
  return map;
}
