import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { AdminShell } from "@/components/admin/shell";
import { LogoutButton } from "@/components/admin/logout-button";
import { getAdminContext } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getAdminContext();

  if (ctx.mode === "anonymous") {
    redirect("/admin/login");
  }

  if (ctx.mode === "unauthorized") {
    return (
      <div className="grid min-h-dvh place-items-center bg-surface px-4">
        <div className="w-full max-w-[420px] rounded-card border border-line bg-bg p-6 text-center">
          <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-[#fdecec] text-danger">
            <ShieldAlert className="h-5 w-5" />
          </span>
          <h1 className="mt-4 text-[16px] font-semibold tracking-tight">
            Akun belum diizinkan
          </h1>
          <p className="mt-1 text-[12px] leading-relaxed text-muted">
            {ctx.email} belum terdaftar sebagai admin. Tambahkan user ini ke
            tabel <code className="font-mono">admins</code> di Supabase.
          </p>
          <div className="mt-4 flex justify-center">
            <LogoutButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminShell
      email={ctx.mode === "admin" ? ctx.email : null}
      demo={ctx.mode === "demo"}
    >
      {children}
    </AdminShell>
  );
}
