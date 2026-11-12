"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";

const RANGES = [
  { value: "7", label: "7 hari" },
  { value: "30", label: "30 hari" },
  { value: "90", label: "90 hari" },
  { value: "365", label: "1 tahun" },
];

const KINDS = [
  { value: "all", label: "Semua" },
  { value: "piket", label: "Piket" },
  { value: "proker", label: "Proker" },
];

const SHIFTS = [
  { value: "all", label: "Semua" },
  { value: "pagi", label: "Pagi" },
  { value: "sore", label: "Sore" },
];

export function FilterBar({
  days,
  shift,
  kind,
  basePath,
  showKind = true,
}: {
  days: number;
  shift: string;
  kind: string;
  basePath: string;
  showKind?: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();

  const push = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());

    if (key === "kind") {
      if (value === "all") next.delete("kind");
      else next.set("kind", value);
      // Proker tidak punya shift; jangan bawa filter yang tidak berlaku.
      if (value === "proker") next.delete("shift");
    } else if (
      (key === "days" && value === "30") ||
      (key === "shift" && value === "all")
    ) {
      next.delete(key);
    } else {
      next.set(key, value);
    }

    const qs = next.toString();
    router.replace(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex rounded-md border border-line bg-surface p-0.5">
        {RANGES.map((range) => (
          <button
            key={range.value}
            type="button"
            onClick={() => push("days", range.value)}
            aria-pressed={String(days) === range.value}
            className={cn(
              "h-7 rounded-[5px] px-2.5 text-[12px] transition-colors",
              String(days) === range.value
                ? "bg-bg font-medium text-fg shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                : "text-muted hover:text-fg",
            )}
          >
            {range.label}
          </button>
        ))}
      </div>

      {showKind ? (
        <div className="flex rounded-md border border-line bg-surface p-0.5">
          {KINDS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => push("kind", item.value)}
              aria-pressed={kind === item.value}
              className={cn(
                "h-7 rounded-[5px] px-2.5 text-[12px] transition-colors",
                kind === item.value
                  ? "bg-bg font-medium text-fg shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                  : "text-muted hover:text-fg",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}

      {kind === "proker" ? null : (
        <div className="flex rounded-md border border-line bg-surface p-0.5">
          {SHIFTS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => push("shift", item.value)}
              aria-pressed={shift === item.value}
              className={cn(
                "h-7 rounded-[5px] px-2.5 text-[12px] transition-colors",
                shift === item.value
                  ? "bg-bg font-medium text-fg shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                  : "text-muted hover:text-fg",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
