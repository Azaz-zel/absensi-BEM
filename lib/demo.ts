import { addDays, todayWIB } from "@/lib/format";
import { DEMO_MINISTRIES, DEMO_PEOPLE } from "@/lib/demo-roster";
import type {
  DashboardData,
  Person,
  SessionKind,
  SessionRow,
  Shift,
} from "@/lib/types";

const ministryName = new Map(DEMO_MINISTRIES.map((m) => [m.id, m.name]));
const personById = new Map(DEMO_PEOPLE.map((p) => [p.id, p]));

/* A spread of people across every ministry, small enough that counts repeat
   and the "paling aktif" ranking shows a real distribution. */
const POOL = DEMO_PEOPLE.filter((_, index) => index % 4 === 0);

/** Four people per session, rotating so some names repeat across sessions. */
function attendeesFor(sessionIndex: number): Person[] {
  return Array.from(
    { length: 4 },
    (_, k) => POOL[(sessionIndex * 5 + k) % POOL.length],
  );
}

export const DEMO_SESSIONS: SessionRow[] = Array.from({ length: 11 }).map(
  (_, i) => {
    const date = addDays(todayWIB(), -i);
    const attendees = attendeesFor(i);
    // Dua sesi terakhir adalah contoh absen proker.
    const isProker = i >= 9;

    return {
      id: `demo-${i}`,
      kind: isProker ? "proker" : "piket",
      date,
      shift: isProker ? null : i % 2 === 0 ? "pagi" : "sore",
      proker_name: isProker
        ? i === 9
          ? "Pameran Inovasi Mahasiswa"
          : "Bakti Sosial Desa"
        : null,
      location: isProker
        ? "Aula Fakultas Teknik"
        : i % 3 === 0
          ? "Sekretariat BEM"
          : "Lobby Fakultas",
      notes: i % 4 === 0 ? "Jaga stand BEM" : null,
      status: i < 3 ? "verified" : "self_reported",
      created_at: `${date}T02:10:00Z`,
      people_count: attendees.length,
      photo_path: null,
      ministries: [
        ...new Set(
          attendees
            .map((p) => (p.ministry_id ? ministryName.get(p.ministry_id) : null))
            .filter((n): n is string => Boolean(n)),
        ),
      ],
    };
  },
);

export function getDemoDashboard(
  period: { kind?: SessionKind | "all"; shift?: Shift | "all" } = {},
): DashboardData {
  const kind = period.kind ?? "all";
  const shift = period.shift ?? "all";

  const rows = DEMO_SESSIONS.map((session, index) => ({ session, index })).filter(
    ({ session }) => {
      if (kind !== "all" && session.kind !== kind) return false;
      if (shift !== "all" && session.shift !== shift) return false;
      return true;
    },
  );

  const counts = new Map<
    string,
    { name: string; ministry: string | null; count: number }
  >();
  const ministryCounts = new Map<string, { name: string; count: number }>();

  for (const { index } of rows) {
    for (const person of attendeesFor(index)) {
      const current = counts.get(person.id);
      if (current) current.count += 1;
      else
        counts.set(person.id, {
          name: person.full_name,
          ministry: person.ministry_id
            ? ministryName.get(person.ministry_id) ?? null
            : null,
          count: 1,
        });

      if (!person.ministry_id) continue;
      const ministry = ministryCounts.get(person.ministry_id);
      if (ministry) ministry.count += 1;
      else
        ministryCounts.set(person.ministry_id, {
          name: ministryName.get(person.ministry_id) ?? "Tanpa kementerian",
          count: 1,
        });
    }
  }

  const daily = rows
    .map(({ session }) => ({ date: session.date, count: session.people_count }))
    .reverse();

  return {
    totalSessions: rows.length,
    totalAttendance: rows.reduce((sum, { session }) => sum + session.people_count, 0),
    totalPeople: DEMO_PEOPLE.length,
    verifiedSessions: rows.filter(({ session }) => session.status === "verified")
      .length,
    topPeople: [...counts.entries()]
      .map(([person_id, v]) => ({ person_id, ...v }))
      .sort(
        (a, b) => b.count - a.count || a.name.localeCompare(b.name),
      ),
    topMinistries: [...ministryCounts.entries()]
      .map(([ministry_id, v]) => ({ ministry_id, ...v }))
      .sort(
        (a, b) => b.count - a.count || a.name.localeCompare(b.name),
      ) as DashboardData["topMinistries"],
    daily,
    recent: rows.slice(0, 8).map(({ session }) => session),
    demo: true,
  };
}

export function demoAttendeesFor(sessionId: string) {
  const index = DEMO_SESSIONS.findIndex((s) => s.id === sessionId);
  if (index < 0) return [];

  return attendeesFor(index)
    .map((person) => {
      const ministry = person.ministry_id
        ? DEMO_MINISTRIES.find((m) => m.id === person.ministry_id)
        : undefined;
      return {
        personId: person.id,
        name: personById.get(person.id)?.full_name ?? person.full_name,
        nim: person.nim,
        ministry: ministry?.name ?? "Tanpa kementerian",
        ministrySort: ministry?.sort_order ?? 99,
      };
    })
    .sort((a, b) => a.ministrySort - b.ministrySort || a.name.localeCompare(b.name));
}
