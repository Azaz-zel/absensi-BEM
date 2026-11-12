import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldAlert, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/brand";
import { AbsenForm } from "@/components/absen-form";
import { SetupNotice } from "@/components/setup-notice";
import { LogoutButton } from "@/components/admin/logout-button";
import { getProkerContext, officerRoleLabel } from "@/lib/proker-auth";
import { getRoster } from "@/lib/roster";
import { DEMO_MINISTRIES, DEMO_PEOPLE } from "@/lib/demo-roster";
import { hasServiceRole, ORG_NAME, CABINET_NAME } from "@/lib/env";
import type { Ministry, Person } from "@/lib/types";

export const metadata = { title: "Absen Proker — BEM PM INSTIKI" };
export const dynamic = "force-dynamic";

export default async function ProkerPage() {
  const ctx = await getProkerContext();

  if (ctx.mode === "anonymous") {
    redirect("/proker/masuk?next=/proker");
  }

  if (ctx.mode === "unconfigured") {
    return (
      <CenteredCard
        icon={<ShieldAlert className="h-5 w-5" />}
        tone="warn"
        title="Absen proker belum siap"
        description="Database Supabase belum dikonfigurasi. Jalankan schema.sql lalu daftarkan akun menteri/wakil menteri."
      />
    );
  }

  if (ctx.mode === "unauthorized") {
    return (
      <CenteredCard
        icon={<ShieldAlert className="h-5 w-5" />}
        tone="danger"
        title="Akun belum diizinkan"
        description={`${ctx.email ?? "Akun ini"} tidak terdaftar sebagai menteri atau wakil menteri. Hubungi admin untuk didaftarkan.`}
        action={
          <LogoutButton redirectTo="/proker/masuk" />
        }
      />
    );
  }

  const { officer } = ctx;
  const demo = ctx.mode === "demo";

  let ministries: Ministry[] = DEMO_MINISTRIES;
  let people: Person[] = DEMO_PEOPLE;
  let rosterReady = false;

  if (hasServiceRole) {
    ministries = [];
    people = [];
    try {
      const roster = await getRoster();
      if (roster.ministries.length) {
        ministries = roster.ministries;
        people = roster.people;
        rosterReady = true;
      }
    } catch {
      // Roster unreachable: the setup notice replaces the form.
    }
  }

  const configured = hasServiceRole && rosterReady;

  return (
    <div className="min-h-dvh bg-surface">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-[600px] items-center justify-between px-4">
          <Brand compact />
          <div className="flex items-center gap-1">
            <span className="hidden max-w-[160px] truncate text-[11px] text-muted sm:block">
              {officer.name}
            </span>
            <LogoutButton compact redirectTo="/proker/masuk" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[600px] px-4 pb-16 pt-5">
        <div className="mb-5">
          <h1 className="text-[22px] font-semibold leading-tight tracking-tight">
            Isi absen proker
          </h1>
          <p className="mt-1 text-[12px] text-muted">
            {ORG_NAME} · {CABINET_NAME}
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-line bg-bg px-2.5 py-1 text-[11px] text-muted">
            <ShieldCheck className="h-3.5 w-3.5" />
            {officerRoleLabel(officer.role)}
            {officer.ministryName
              ? ` · ${officer.ministryName.replace("Kementerian ", "")}`
              : ""}
          </div>
        </div>

        {hasServiceRole && !rosterReady ? (
          <SetupNotice />
        ) : (
          <AbsenForm
            kind="proker"
            ministries={ministries}
            people={people}
            configured={configured}
            officer={{ name: officer.name, ministryId: officer.ministryId }}
            blockedReason={
              demo
                ? "Mode demo: absen proker bisa dilihat, tapi belum bisa dikirim."
                : "Data roster belum siap. Jalankan schema.sql lalu seed.sql."
            }
          />
        )}

        <p className="mt-8 text-center text-[12px] leading-relaxed text-subtle">
          Absen proker hanya dapat diisi menteri dan wakil menteri. Foto bukti
          disimpan maksimal 12 bulan dan hanya dapat diakses admin.
        </p>

        <Link
          href="/"
          className="mt-4 flex items-center justify-center gap-1.5 text-[12px] text-muted transition-colors hover:text-fg"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali ke pilihan absen
        </Link>
      </main>
    </div>
  );
}

function CenteredCard({
  icon,
  tone,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  tone: "warn" | "danger";
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh place-items-center bg-surface px-4">
      <div className="w-full max-w-[420px] rounded-card border border-line bg-bg p-6 text-center">
        <span
          className={
            tone === "warn"
              ? "mx-auto grid h-10 w-10 place-items-center rounded-full bg-warn/10 text-warn"
              : "mx-auto grid h-10 w-10 place-items-center rounded-full bg-danger-soft text-danger"
          }
        >
          {icon}
        </span>
        <h1 className="mt-4 text-[16px] font-semibold tracking-tight">
          {title}
        </h1>
        <p className="mt-1 text-[12px] leading-relaxed text-muted">
          {description}
        </p>
        <div className="mt-4 flex justify-center gap-2">
          {action}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] text-muted transition-colors hover:bg-surface hover:text-fg"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Pilihan absen
          </Link>
        </div>
      </div>
    </div>
  );
}
