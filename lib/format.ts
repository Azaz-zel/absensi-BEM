import type { SessionKind, Shift } from "@/lib/types";

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Today's date in Asia/Jakarta as YYYY-MM-DD. */
export function todayWIB(): string {
  return new Date(Date.now() + WIB_OFFSET_MS).toISOString().slice(0, 10);
}

/** Add days to a YYYY-MM-DD string, in calendar days (no timezone drift). */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function shiftLabel(shift: Shift | null): string {
  if (shift === "pagi") return "Pagi";
  if (shift === "sore") return "Sore";
  return "—";
}

export function kindLabel(kind: SessionKind): string {
  return kind === "piket" ? "Piket" : "Proker";
}

const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

/** "2026-11-11" -> "Rab, 11 Nov 2026" */
export function formatDate(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  return `${DAY_NAMES[d.getUTCDay()]}, ${d.getUTCDate()} ${
    MONTH_NAMES[d.getUTCMonth()]
  } ${d.getUTCFullYear()}`;
}

/** "2026-11-11" -> "11 Nov" */
export function formatDateShort(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  return `${d.getUTCDate()} ${MONTH_NAMES[d.getUTCMonth()]}`;
}

/** ISO timestamp -> "11 Nov, 14.05" in WIB. */
export function formatDateTime(iso: string): string {
  const d = new Date(new Date(iso).getTime() + WIB_OFFSET_MS);
  const time = `${String(d.getUTCHours()).padStart(2, "0")}.${String(
    d.getUTCMinutes(),
  ).padStart(2, "0")}`;
  return `${d.getUTCDate()} ${MONTH_NAMES[d.getUTCMonth()]}, ${time}`;
}

/** Normalise a name for duplicate detection. */
export function nameKey(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}
