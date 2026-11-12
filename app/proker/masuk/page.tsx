import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { Brand } from "@/components/brand";
import { LoginForm } from "@/components/admin/login-form";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata = { title: "Masuk — Absen Proker" };
export const dynamic = "force-dynamic";

export default function ProkerLoginPage() {
  return (
    <div className="grid min-h-dvh place-items-center bg-surface px-4 py-10">
      <div className="w-full max-w-[380px]">
        <Brand className="mb-6 justify-center" />

        <div className="rounded-card border border-line bg-bg p-5">
          <h1 className="mb-4 text-[17px] font-semibold tracking-tight">
            Masuk petugas proker
          </h1>

          {isSupabaseConfigured ? (
            <Suspense fallback={<div className="h-40" />}>
              <LoginForm fallback="/proker" allowPrefix="/proker" />
            </Suspense>
          ) : (
            <div className="rounded-md border border-warn/25 bg-warn/5 p-3 text-[12px] leading-relaxed text-warn">
              Supabase belum dikonfigurasi. Isi{" "}
              <code className="font-mono">.env.local</code> lalu jalankan{" "}
              <code className="font-mono">supabase/schema.sql</code>.
            </div>
          )}
        </div>

        <Link
          href="/"
          className="mt-5 flex items-center justify-center gap-1.5 text-[12px] text-muted transition-colors hover:text-fg"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali
        </Link>
      </div>
    </div>
  );
}
