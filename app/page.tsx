import Link from "next/link";
import { ArrowRight, CalendarDays, ClipboardList } from "lucide-react";
import { Brand } from "@/components/brand";

export const metadata = { title: "Absen — BEM PM INSTIKI" };

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-surface">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-[600px] items-center px-4">
          <Brand compact />
        </div>
      </header>

      <main className="mx-auto max-w-[600px] px-4 pb-16 pt-8">
        <h1 className="mb-5 text-[24px] font-semibold leading-tight tracking-tight">
          Mau absen apa?
        </h1>

        <div className="space-y-3">
          <Link
            href="/piket"
            className="group flex items-center gap-4 rounded-card border border-line bg-bg p-4 transition-colors hover:border-line-strong hover:bg-surface"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-surface text-fg">
              <CalendarDays className="h-5 w-5" />
            </span>
            <span className="flex-1 text-[15px] font-semibold tracking-tight">
              Absen piket
            </span>
            <ArrowRight className="h-4 w-4 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-fg" />
          </Link>

          <Link
            href="/proker"
            className="group flex items-center gap-4 rounded-card border border-line bg-bg p-4 transition-colors hover:border-line-strong hover:bg-surface"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-surface text-fg">
              <ClipboardList className="h-5 w-5" />
            </span>
            <span className="flex-1 text-[15px] font-semibold tracking-tight">
              Absen proker
            </span>
            <ArrowRight className="h-4 w-4 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-fg" />
          </Link>
        </div>
      </main>
    </div>
  );
}
