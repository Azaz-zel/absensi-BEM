import { Trash2, UserPlus } from "lucide-react";
import { Card, CardHeader, EmptyState, Input, Select } from "@/components/ui";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { createOfficer, deleteOfficer } from "@/app/admin/actions";
import { isDemoMode, loadMinistries } from "@/lib/admin-data";
import { officerRoleLabel } from "@/lib/proker-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Petugas Proker — Absen Piket" };
export const dynamic = "force-dynamic";

type OfficerRow = {
  user_id: string;
  email: string | null;
  full_name: string;
  role: "menteri" | "wakil_menteri";
  ministries: { name: string } | null;
};

export default async function PetugasPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const demo = isDemoMode();
  const ministries = await loadMinistries();

  let officers: OfficerRow[] = [];
  if (!demo) {
    const { data } = await createSupabaseAdminClient()
      .from("proker_officers")
      .select("user_id, email, full_name, role, ministries(name)")
      .order("created_at");
    officers = (data ?? []) as unknown as OfficerRow[];
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[20px] font-semibold tracking-tight">
          Petugas proker
        </h1>
        <p className="mt-1 text-[12px] text-muted">
          Akun menteri dan wakil menteri untuk login di absen proker.
        </p>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-[13px] text-danger"
        >
          {error}
        </p>
      ) : null}

      <Card>
        <CardHeader title="Daftar petugas" />
        {officers.length ? (
          <ul className="divide-y divide-line">
            {officers.map((o) => (
              <li
                key={o.user_id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium">
                    {o.full_name}
                  </p>
                  <p className="truncate text-[12px] text-muted">
                    {officerRoleLabel(o.role)} · {o.ministries?.name ?? "—"} ·{" "}
                    {o.email}
                  </p>
                </div>
                <form action={deleteOfficer}>
                  <input type="hidden" name="user_id" value={o.user_id} />
                  <ConfirmButton
                    message={`Hapus akun ${o.full_name}? Dia tidak bisa login lagi. Absen yang sudah masuk tetap tersimpan.`}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line px-3 text-[13px] font-medium text-danger transition-colors hover:border-danger/40 hover:bg-danger/5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Hapus
                  </ConfirmButton>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Belum ada petugas"
            description="Tambahkan akun menteri atau wakil menteri di bawah."
          />
        )}
      </Card>

      {!demo ? (
        <Card>
          <CardHeader
            title="Tambah petugas"
            description="Berikan email dan password ini ke yang bersangkutan untuk login di /proker/masuk."
          />
          <form action={createOfficer} className="grid gap-2 p-3 sm:grid-cols-2">
            <Input name="full_name" placeholder="Nama lengkap" required />
            <Input
              name="email"
              type="email"
              placeholder="Email"
              autoComplete="off"
              required
            />
            <Input
              name="password"
              type="text"
              placeholder="Password (min. 8 karakter)"
              minLength={8}
              autoComplete="new-password"
              required
            />
            <Select name="ministry_id" defaultValue="" required>
              <option value="">Pilih kementerian…</option>
              {ministries
                .filter((m) => m.is_active)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
            </Select>
            <Select name="role" defaultValue="menteri">
              <option value="menteri">Menteri</option>
              <option value="wakil_menteri">Wakil Menteri</option>
            </Select>
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md bg-fg px-4 text-[13px] font-medium text-bg transition-colors hover:bg-black/85"
            >
              <UserPlus className="h-4 w-4" />
              Tambah
            </button>
          </form>
        </Card>
      ) : null}
    </div>
  );
}
