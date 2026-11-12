import Link from "next/link";
import { Brand } from "@/components/brand";
import { AbsenForm } from "@/components/absen-form";
import { SetupNotice } from "@/components/setup-notice";
import { getRoster } from "@/lib/roster";
import { DEMO_MINISTRIES, DEMO_PEOPLE } from "@/lib/demo-roster";
import { hasServiceRole, ORG_NAME, CABINET_NAME } from "@/lib/env";
import type { Ministry, Person } from "@/lib/types";

export const metadata = { title: "Absen Piket — BEM PM INSTIKI" };
export const dynamic = "force-dynamic";

export default async function PiketPage() {
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
      // Roster unreachable: the page shows the setup notice instead.
    }
  }

  const configured = hasServiceRole && rosterReady;
  const needsSetup = hasServiceRole && !rosterReady;

  return (
    <div className="min-h-dvh bg-surface">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-[600px] items-center justify-between px-4">
          <Brand compact />
          <Link
            href="/"
            className="text-[11px] text-muted transition-colors hover:text-fg"
          >
            Pilihan absen
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[600px] px-4 pb-16 pt-5">
        <div className="mb-5">
          <h1 className="text-[22px] font-semibold leading-tight tracking-tight">
            Isi absen piket
          </h1>
          <p className="mt-1 text-[12px] text-muted">
            {ORG_NAME} · {CABINET_NAME}
          </p>
        </div>

        {needsSetup ? (
          <SetupNotice />
        ) : (
          <AbsenForm
            kind="piket"
            ministries={ministries}
            people={people}
            configured={configured}
            blockedReason={
              hasServiceRole
                ? "Data roster belum siap. Jalankan schema.sql lalu seed.sql."
                : "Supabase belum dikonfigurasi. Form bisa diisi, tapi belum bisa dikirim."
            }
          />
        )}

        <p className="mt-8 text-center text-[12px] leading-relaxed text-subtle">
          Data internal organisasi. Foto bukti disimpan maksimal 12 bulan dan
          hanya dapat diakses admin.
        </p>
      </main>
    </div>
  );
}
