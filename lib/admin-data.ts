import { DEMO_MODE, hasServiceRole } from "@/lib/env";
import { DEMO_MINISTRIES, DEMO_PEOPLE } from "@/lib/demo-roster";
import { DEMO_SESSIONS, demoAttendeesFor, getDemoDashboard } from "@/lib/demo";
import {
  defaultPeriod,
  getAllMinistries,
  getAllPeople,
  getDashboardData,
  getSessionDetail,
  getSessions,
  type Period,
} from "@/lib/roster";
import type { DashboardData, Ministry, Person, SessionRow } from "@/lib/types";

export function isDemoMode() {
  return DEMO_MODE && !hasServiceRole;
}

export async function loadDashboard(period: Period): Promise<DashboardData> {
  if (isDemoMode()) return getDemoDashboard(period);
  return getDashboardData(period);
}

export async function loadSessions(
  period: Period,
  search?: string,
): Promise<SessionRow[]> {
  if (isDemoMode()) {
    let rows = DEMO_SESSIONS;

    if (period.kind && period.kind !== "all") {
      rows = rows.filter((s) => s.kind === period.kind);
    }
    if (period.shift && period.shift !== "all") {
      rows = rows.filter((s) => s.shift === period.shift);
    }
    if (search?.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((s) =>
        s.ministries.some((m) => m.toLowerCase().includes(q)),
      );
    }
    return rows;
  }
  return getSessions(period, { search });
}

export async function loadSessionDetail(id: string) {
  if (isDemoMode()) {
    const session = DEMO_SESSIONS.find((s) => s.id === id);
    if (!session) return null;
    return {
      session,
      attendees: demoAttendeesFor(id),
      submissions: [] as Array<{
        id: string;
        submitter_name: string;
        photo_path: string | null;
        note: string | null;
        created_at: string;
        status: "self_reported" | "verified";
        photoUrl: string | null;
      }>,
      ministries: session.ministries,
    };
  }
  return getSessionDetail(id);
}

export async function loadPeople(): Promise<Person[]> {
  if (isDemoMode()) return DEMO_PEOPLE;
  return getAllPeople();
}

export async function loadMinistries(): Promise<Ministry[]> {
  if (isDemoMode()) return DEMO_MINISTRIES;
  return getAllMinistries();
}

export { defaultPeriod };
