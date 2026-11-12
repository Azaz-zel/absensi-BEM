import Link from "next/link";
import { Search, Download } from "lucide-react";
import { Card, EmptyState } from "@/components/ui";
import { FilterBar } from "@/components/admin/filter-bar";
import { SessionTable } from "@/components/admin/session-table";
import { loadSessions } from "@/lib/admin-data";
import { addDays, todayWIB } from "@/lib/format";

export const metadata = { title: "Sesi — Absen Piket" };
export const dynamic = "force-dynamic";

const RANGES = [7, 30, 90, 365];

export default async function SesiPage({
  searchParams,
}: {
  searchParams: Promise<{
    days?: string;
    shift?: string;
    kind?: string;
    q?: string;
  }>;
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
  const q = (sp.q ?? "").trim();

  const to = todayWIB();
  const from = addDays(to, -(days - 1));
  const sessions = await loadSessions({ from, to, shift, kind }, q);

  const exportQuery = new URLSearchParams({
    from,
    to,
    shift,
    kind,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight">
            Sesi absen
          </h1>
          <p className="mt-1 text-[12px] text-muted">
            {sessions.length} sesi ditemukan
          </p>
        </div>
        <div className="flex items-center gap-2">
          <FilterBar
            days={days}
            shift={shift}
            kind={kind}
            basePath="/admin/sesi"
          />
          <a
            href={`/api/export?${exportQuery.toString()}`}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-bg px-3 text-[12px] font-medium text-muted transition-colors hover:bg-surface hover:text-fg"
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </a>
        </div>
      </div>

      <form method="get" className="flex items-center gap-2">
        <input type="hidden" name="days" value={days} />
        <input type="hidden" name="shift" value={shift} />
        <input type="hidden" name="kind" value={kind} />
        <div className="relative w-full max-w-[320px]">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-subtle" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Cari nama orang…"
            className="h-9 w-full rounded-md border border-line bg-bg pl-9 pr-3 text-[13px] placeholder:text-subtle focus:border-fg focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="h-9 rounded-md border border-line px-3 text-[12px] font-medium text-muted transition-colors hover:bg-surface hover:text-fg"
        >
          Cari
        </button>
        {q ? (
          <Link
            href={`/admin/sesi?days=${days}&shift=${shift}&kind=${kind}`}
            className="text-[12px] text-subtle underline-offset-2 hover:underline"
          >
            Reset
          </Link>
        ) : null}
      </form>

      <Card>
        {sessions.length ? (
          <SessionTable sessions={sessions} />
        ) : (
          <EmptyState
            title={q ? "Tidak ada sesi yang cocok" : "Belum ada sesi"}
            description={
              q
                ? "Coba kata kunci lain atau perlebar rentang tanggal."
                : "Sesi muncul setelah ada yang mengisi form absen."
            }
          />
        )}
      </Card>
    </div>
  );
}
