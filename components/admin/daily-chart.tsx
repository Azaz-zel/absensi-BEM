import { cn } from "@/lib/cn";
import { addDays, formatDateShort } from "@/lib/format";

export function DailyChart({
  daily,
  from,
  to,
  className,
}: {
  daily: Array<{ date: string; count: number }>;
  from: string;
  to: string;
  className?: string;
}) {
  const counts = new Map(daily.map((d) => [d.date, d.count]));
  const days: Array<{ date: string; count: number }> = [];

  let cursor = from;
  let guard = 0;
  while (cursor <= to && guard < 400) {
    days.push({ date: cursor, count: counts.get(cursor) ?? 0 });
    cursor = addDays(cursor, 1);
    guard += 1;
  }

  const max = Math.max(1, ...days.map((d) => d.count));
  const total = days.reduce((sum, d) => sum + d.count, 0);
  const peak = days.reduce(
    (best, d) => (d.count > best.count ? d : best),
    days[0] ?? { date: to, count: 0 },
  );

  return (
    <div className={cn("px-4 pb-4 pt-3", className)}>
      <div className="mb-3 flex items-baseline justify-between">
        <p className="text-[12px] text-muted">
          <span className="tnum font-medium text-fg">{total}</span> kehadiran
        </p>
        {peak.count > 0 ? (
          <p className="text-[11px] text-subtle">
            Puncak {formatDateShort(peak.date)} · {peak.count}
          </p>
        ) : null}
      </div>

      <div className="flex h-[104px] items-end gap-[3px]" role="img" aria-label="Grafik kehadiran harian">
        {days.map((day) => {
          const height = day.count === 0 ? 3 : Math.max(6, (day.count / max) * 100);
          return (
            <div
              key={day.date}
              title={`${formatDateShort(day.date)} — ${day.count} kehadiran`}
              className="group relative flex-1"
              style={{ height: `${height}%` }}
            >
              <div
                className={cn(
                  "h-full w-full rounded-[2px] transition-colors",
                  day.count === 0
                    ? "bg-surface-2"
                    : "bg-chart group-hover:bg-accent",
                )}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex justify-between text-[10px] text-subtle">
        <span>{formatDateShort(from)}</span>
        <span>{formatDateShort(to)}</span>
      </div>
    </div>
  );
}
