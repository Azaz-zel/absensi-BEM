import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Card, CardHeader, EmptyState, Stat } from "@/components/ui";
import { FilterBar } from "@/components/admin/filter-bar";
import { DailyChart } from "@/components/admin/daily-chart";
import { SessionTable } from "@/components/admin/session-table";
import { loadDashboard } from "@/lib/admin-data";
import { addDays, formatDate, kindLabel, shiftLabel, todayWIB } from "@/lib/format";

export const metadata = { title: "Ringkasan — Absen Piket" };
export const dynamic = "force-dynamic";

const RANGES = [7, 30, 90, 365];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string; shift?: string; kind?: string }>;
}) {
  const sp = await searchParams;
  const days = RANGES.includes(Number(sp.days)) ? Number(sp.days) : 30;
  const kind =
    sp.kind === "piket" || sp.kind === "proker" ? sp.kind : ("all" as const);
  const shift =
    kind === "proker"
      ? ("all" as const)
      : sp.shift === "pagi" || sp.shift === "sore"
        ? sp.shift
        : ("all" as const);

  const to = todayWIB();
  const from = addDays(to, -(days - 1));
  const data = await loadDashboard({ from, to, shift, kind });

  const average = data.totalSessions
    ? data.totalAttendance / data.totalSessions
    : 0;

  const maxPerson = Math.max(1, ...data.topPeople.map((p) => p.count));
  const maxMinistry = Math.max(1, ...data.topMinistries.map((m) => m.count));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight">Ringkasan</h1>
          <p className="mt-1 text-[12px] text-muted">
            {formatDate(from)} – {formatDate(to)}
            <span className="mx-1.5 text-line">|</span>
            {kind === "all" ? "Semua jenis" : kindLabel(kind)}
            {kind === "proker" ? null : (
              <>
                <span className="mx-1.5 text-line">|</span>
                {shift === "all" ? "Semua shift" : `Shift ${shiftLabel(shift)}`}
              </>
            )}
          </p>
        </div>
        <FilterBar days={days} shift={shift} kind={kind} basePath="/admin" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Sesi tercatat"
          value={data.totalSessions}
          hint={`${data.verifiedSessions} terverifikasi`}
        />
        <Stat
          label="Total kehadiran"
          value={data.totalAttendance}
          hint="Orang × sesi"
        />
        <Stat
          label="Rata-rata per sesi"
          value={average.toFixed(1)}
          hint="Orang hadir"
        />
        <Stat label="Orang di roster" value={data.totalPeople} hint="Aktif" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <Card>
            <CardHeader
              title="Kehadiran harian"
              description="Jumlah orang yang tercatat per tanggal"
            />
            <DailyChart daily={data.daily} from={from} to={to} />
          </Card>

          <Card>
            <CardHeader
              title="Sesi terbaru"
              action={
                <Link
                  href={`/admin/sesi/${kind === "proker" ? "proker" : "piket"}`}
                  className="flex items-center gap-1 text-[12px] text-muted transition-colors hover:text-fg"
                >
                  Lihat semua
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              }
            />
            {data.recent.length ? (
              <SessionTable sessions={data.recent} compact />
            ) : (
              <EmptyState
                title="Belum ada sesi"
                description="Sesi muncul setelah ada yang mengisi form absen."
              />
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Paling aktif"
              description={`Top ${Math.min(8, data.topPeople.length)} · ${days} hari`}
            />
            {data.topPeople.length ? (
              <ol className="divide-y divide-line">
                {data.topPeople.slice(0, 8).map((person, index) => (
                  <li
                    key={person.person_id}
                    className="flex items-center gap-3 px-4 py-2.5"
                  >
                    <span className="tnum w-4 shrink-0 text-2xs text-subtle">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium leading-tight">
                        {person.name}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-subtle">
                        {person.ministry?.replace("Kementerian ", "") ?? "—"}
                      </p>
                      <div className="mt-1.5 h-[2px] w-full rounded-full bg-surface-2">
                        <div
                          className="h-full rounded-full bg-fg/70"
                          style={{
                            width: `${(person.count / maxPerson) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="tnum shrink-0 text-[13px] font-medium">
                      {person.count}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState title="Belum ada data" />
            )}
          </Card>

          <Card>
            <CardHeader
              title="Kementerian"
              description="Jumlah kehadiran"
            />
            {data.topMinistries.length ? (
              <div className="space-y-3 px-4 py-3">
                {data.topMinistries.map((ministry) => (
                  <div key={ministry.ministry_id}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span
                        className="truncate text-[12px]"
                        title={ministry.name}
                      >
                        {ministry.name.replace("Kementerian ", "")}
                      </span>
                      <span className="tnum text-[12px] font-medium">
                        {ministry.count}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full bg-fg"
                        style={{
                          width: `${(ministry.count / maxMinistry) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Belum ada data" />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
