import { DatabaseZap } from "lucide-react";
import { cn } from "@/lib/cn";

/** Shown when Supabase is reachable but the tables/roster are not seeded yet. */
export function SetupNotice({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-card border border-line bg-bg p-5 text-center",
        className,
      )}
    >
      <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-warn/10 text-warn">
        <DatabaseZap className="h-5 w-5" />
      </span>
      <h2 className="mt-3 text-[15px] font-semibold tracking-tight">
        Database belum siap
      </h2>
      <p className="mx-auto mt-1 max-w-[380px] text-[12px] leading-relaxed text-muted">
        Jalankan <code className="font-mono">supabase/schema.sql</code> lalu{" "}
        <code className="font-mono">supabase/seed.sql</code> di SQL Editor
        Supabase. Setelah selesai, muat ulang halaman ini.
      </p>
    </div>
  );
}
