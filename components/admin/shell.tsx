"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Users,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Brand } from "@/components/brand";
import { LogoutButton } from "@/components/admin/logout-button";
import { Badge } from "@/components/ui";

const NAV = [
  { href: "/admin", label: "Ringkasan", icon: LayoutDashboard },
  { href: "/admin/sesi/piket", label: "Piket", icon: CalendarDays },
  { href: "/admin/sesi/proker", label: "Proker", icon: ClipboardList },
  { href: "/admin/orang", label: "Orang", icon: Users },
  { href: "/admin/kementerian", label: "Kementerian", icon: Building2 },
  { href: "/admin/petugas", label: "Petugas", icon: BriefcaseBusiness },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname.startsWith(href);
}

export function AdminShell({
  children,
  email,
  demo,
}: {
  children: React.ReactNode;
  email?: string | null;
  demo?: boolean;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh bg-bg">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[232px] flex-col border-r border-line bg-bg md:flex">
        <div className="flex h-14 items-center px-4">
          <Brand href="/admin" />
        </div>

        <nav className="space-y-0.5 px-2 pt-2">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-9 items-center gap-2.5 rounded-md px-2.5 text-[13px] transition-colors",
                  active
                    ? "bg-surface-2 font-medium text-fg"
                    : "text-muted hover:bg-surface hover:text-fg",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-2 border-t border-line p-3">
          {demo ? (
            <Badge tone="warn" className="w-full justify-center">
              Mode demo
            </Badge>
          ) : null}
          {email ? (
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-[11px] text-subtle" title={email}>
                {email}
              </span>
              <LogoutButton compact />
            </div>
          ) : null}
          <Link
            href="/"
            className="block rounded-md px-2 py-1.5 text-[11px] text-muted transition-colors hover:bg-surface hover:text-fg"
          >
            Buka halaman absen →
          </Link>
        </div>
      </aside>

      <div className="md:pl-[232px]">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-bg/85 px-4 backdrop-blur md:hidden">
          <Brand href="/admin" />
          <div className="flex items-center gap-2">
            {demo ? <Badge tone="warn">Demo</Badge> : null}
            {email ? <LogoutButton compact /> : null}
          </div>
        </header>

        <main className="mx-auto max-w-[1120px] px-4 pb-24 pt-5 sm:px-6 sm:pb-10 sm:pt-7 md:pb-10">
          {children}
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[10px] transition-colors",
                  active ? "text-fg" : "text-subtle",
                )}
              >
                <Icon className={cn("h-[18px] w-[18px]", active && "stroke-[2.2]")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
