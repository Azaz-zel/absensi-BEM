import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatDate, shiftLabel } from "@/lib/format";
import { StatusBadge } from "@/components/admin/status-badge";
import type { SessionKind, SessionRow } from "@/lib/types";

export function SessionTable({
  sessions,
  compact = false,
  kind,
  className,
}: {
  sessions: SessionRow[];
  compact?: boolean;
  /** Set on a single-kind list: the Jenis column becomes Shift or Petugas. */
  kind?: SessionKind;
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-[520px] border-collapse text-left">
        <thead>
          <tr className="border-b border-line text-2xs uppercase tracking-[0.06em] text-subtle">
            <th className="px-4 py-2 font-medium">Tanggal</th>
            <th className="px-2 py-2 font-medium">
              {kind === "piket" ? "Shift" : kind === "proker" ? "Petugas" : "Jenis"}
            </th>
            <th className="px-2 py-2 font-medium">Kementerian</th>
            <th className="px-2 py-2 text-right font-medium">Orang</th>
            <th className="px-4 py-2 text-right font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => (
            <tr
              key={session.id}
              className="border-b border-line last:border-0 hover:bg-surface"
            >
              <td className="whitespace-nowrap px-4 py-2.5 text-[13px]">
                <Link
                  href={`/admin/sesi/${session.id}`}
                  className="font-medium underline-offset-2 hover:underline"
                >
                  {formatDate(session.date)}
                </Link>
                {session.kind === "proker" ? (
                  session.proker_name ? (
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-subtle">
                      {session.proker_name}
                    </p>
                  ) : null
                ) : !compact && session.location ? (
                  <p className="mt-0.5 text-[11px] text-subtle">
                    {session.location}
                  </p>
                ) : null}
              </td>
              <td className="whitespace-nowrap px-2 py-2.5 text-[12px] text-muted">
                {kind === "proker" ? (
                  <span className="line-clamp-1 max-w-[180px]">
                    {session.submitters?.join(", ") || "—"}
                  </span>
                ) : session.kind === "proker" ? (
                  <span className="inline-flex items-center rounded-full border border-line px-1.5 py-0.5 text-[10px] font-medium">
                    Proker
                  </span>
                ) : (
                  shiftLabel(session.shift)
                )}
              </td>
              <td className="max-w-[220px] px-2 py-2.5 text-[12px] text-muted">
                <span className="line-clamp-1">
                  {session.ministries.length
                    ? session.ministries
                        .map((m) => m.replace("Kementerian ", ""))
                        .join(", ")
                    : "—"}
                </span>
              </td>
              <td className="tnum px-2 py-2.5 text-right text-[13px]">
                {session.people_count}
              </td>
              <td className="px-4 py-2.5 text-right">
                <StatusBadge status={session.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
