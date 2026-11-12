import { ChevronDown, Search, UserPlus } from "lucide-react";
import { Card, CardHeader, EmptyState, Input, Select } from "@/components/ui";
import {
  approvePendingPerson,
  createPerson,
  mergePeople,
  updatePerson,
} from "@/app/admin/actions";
import { isDemoMode, loadMinistries, loadPeople } from "@/lib/admin-data";

export const metadata = { title: "Orang — Absen Piket" };
export const dynamic = "force-dynamic";

export default async function OrangPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().toLowerCase();

  const [people, ministries] = await Promise.all([
    loadPeople(),
    loadMinistries(),
  ]);

  const ministryName = new Map(ministries.map((m) => [m.id, m.name]));
  const filtered = q
    ? people.filter(
        (p) =>
          p.full_name.toLowerCase().includes(q) ||
          (p.nim ?? "").includes(q),
      )
    : people;

  const pending = filtered.filter((p) => p.source === "pending");
  const roster = filtered.filter((p) => p.source !== "pending");
  const demo = isDemoMode();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[20px] font-semibold tracking-tight">Orang</h1>
        <p className="mt-1 text-[12px] text-muted">
          {people.length} orang di roster · {pending.length} menunggu
          persetujuan
        </p>
      </div>

      <form method="get" className="relative w-full max-w-[320px]">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-subtle" />
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Cari nama atau NIM…"
          className="h-9 w-full rounded-md border border-line bg-bg pl-9 pr-3 text-[13px] placeholder:text-subtle focus:border-fg focus:outline-none"
        />
      </form>

      {!demo ? (
        <Card>
          <CardHeader
            title="Tambah orang"
            description="Untuk fungsionaris yang belum ada di roster."
          />
          <form
            action={createPerson}
            className="grid gap-2 p-3 sm:grid-cols-[1fr_140px_1fr_auto]"
          >
            <Input name="full_name" placeholder="Nama lengkap" required />
            <Input name="nim" placeholder="NIM (opsional)" inputMode="numeric" />
            <Select name="ministry_id" defaultValue="">
              <option value="">Pilih kementerian…</option>
              {ministries.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
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

      {pending.length ? (
        <Card>
          <CardHeader
            title="Menunggu persetujuan"
            description="Nama yang diketik manual di form absen."
          />
          <ul className="divide-y divide-line">
            {pending.map((person) => (
              <li
                key={person.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium">
                    {person.full_name}
                  </p>
                  <p className="text-[11px] text-subtle">
                    Nama baru dari form absen
                  </p>
                </div>
                {demo ? null : (
                  <form
                    action={approvePendingPerson}
                    className="flex items-center gap-2"
                  >
                    <input type="hidden" name="id" value={person.id} />
                    <Select
                      name="ministry_id"
                      defaultValue={person.ministry_id ?? ""}
                      className="h-8 w-[210px] text-[12px]"
                    >
                      <option value="">Kementerian…</option>
                      {ministries.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </Select>
                    <button
                      type="submit"
                      className="h-8 rounded-md border border-line px-3 text-[12px] font-medium transition-colors hover:bg-surface"
                    >
                      Setujui
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card>
        <CardHeader
          title="Roster"
          description={`${roster.length} orang${q ? " cocok" : ""}`}
        />
        {roster.length ? (
          <ul className="divide-y divide-line">
            {roster.map((person) => (
              <li key={person.id} className="px-4">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium">
                        {person.full_name}
                      </p>
                      <p className="mt-0.5 text-[11px] text-subtle">
                        {person.nim ?? "Tanpa NIM"} ·{" "}
                        {person.ministry_id
                          ? ministryName.get(person.ministry_id)?.replace(
                              "Kementerian ",
                              "",
                            )
                          : "Tanpa kementerian"}
                        {person.is_active ? "" : " · Nonaktif"}
                      </p>
                    </div>
                    <ChevronDown className="h-4 w-4 shrink-0 text-subtle transition-transform group-open:rotate-180" />
                  </summary>

                  {demo ? (
                    <p className="pb-3 text-[11px] text-subtle">
                      Mode demo — edit dinonaktifkan.
                    </p>
                  ) : (
                    <form
                      action={updatePerson}
                      className="grid gap-2 pb-3 sm:grid-cols-[1fr_140px_1fr_auto_auto]"
                    >
                      <input type="hidden" name="id" value={person.id} />
                      <Input
                        name="full_name"
                        defaultValue={person.full_name}
                        className="h-9 text-[13px]"
                        required
                      />
                      <Input
                        name="nim"
                        defaultValue={person.nim ?? ""}
                        className="h-9 text-[13px]"
                        placeholder="NIM"
                      />
                      <Select
                        name="ministry_id"
                        defaultValue={person.ministry_id ?? ""}
                        className="h-9 text-[13px]"
                      >
                        <option value="">Tanpa kementerian</option>
                        {ministries.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </Select>
                      <label className="flex h-9 items-center gap-1.5 text-[12px] text-muted">
                        <input
                          type="checkbox"
                          name="is_active"
                          value="1"
                          defaultChecked={person.is_active}
                          className="h-4 w-4 accent-black"
                        />
                        Aktif
                      </label>
                      <button
                        type="submit"
                        className="h-9 rounded-md border border-line px-3 text-[12px] font-medium transition-colors hover:bg-surface"
                      >
                        Simpan
                      </button>
                    </form>
                  )}
                </details>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Tidak ada orang"
            description={q ? "Coba kata kunci lain." : "Roster masih kosong."}
          />
        )}
      </Card>

      {!demo ? (
        <Card>
          <CardHeader
            title="Gabung nama duplikat"
            description="Pindahkan semua kehadiran ke nama utama, lalu nonaktifkan nama lama."
          />
          <form
            action={mergePeople}
            className="grid gap-2 p-3 sm:grid-cols-[1fr_1fr_auto]"
          >
            <Select name="source_id" defaultValue="" required>
              <option value="">Nama duplikat (dihapus)…</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </Select>
            <Select name="target_id" defaultValue="" required>
              <option value="">Nama utama (dipertahankan)…</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </Select>
            <button
              type="submit"
              className="h-10 rounded-md border border-line px-4 text-[13px] font-medium transition-colors hover:bg-surface"
            >
              Gabungkan
            </button>
          </form>
        </Card>
      ) : null}
    </div>
  );
}
