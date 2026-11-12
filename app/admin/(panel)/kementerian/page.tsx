import { Plus } from "lucide-react";
import { Card, CardHeader, Input } from "@/components/ui";
import { createMinistry, updateMinistry } from "@/app/admin/actions";
import { isDemoMode, loadMinistries, loadPeople } from "@/lib/admin-data";

export const metadata = { title: "Kementerian — Absen Piket" };
export const dynamic = "force-dynamic";

export default async function KementerianPage() {
  const [ministries, people] = await Promise.all([
    loadMinistries(),
    loadPeople(),
  ]);
  const demo = isDemoMode();

  const headcount = new Map<string, number>();
  for (const person of people) {
    if (!person.ministry_id) continue;
    headcount.set(
      person.ministry_id,
      (headcount.get(person.ministry_id) ?? 0) + 1,
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[20px] font-semibold tracking-tight">
          Kementerian
        </h1>
        <p className="mt-1 text-[12px] text-muted">
          Dipakai sebagai pilihan di form absen dan dasar ranking.
        </p>
      </div>

      <Card>
        <CardHeader title="Daftar kementerian" />
        <ul className="divide-y divide-line">
          {ministries.map((ministry) => (
            <li key={ministry.id} className="px-4 py-3">
              {demo ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[13px] font-medium">
                    {ministry.name}
                  </span>
                  <span className="text-[11px] text-subtle">
                    {headcount.get(ministry.id) ?? 0} orang
                  </span>
                </div>
              ) : (
                <form
                  action={updateMinistry}
                  className="grid items-center gap-2 sm:grid-cols-[1fr_70px_auto_auto]"
                >
                  <input type="hidden" name="id" value={ministry.id} />
                  <Input
                    name="name"
                    defaultValue={ministry.name}
                    className="h-9 text-[13px]"
                    required
                  />
                  <Input
                    name="sort_order"
                    type="number"
                    defaultValue={ministry.sort_order}
                    className="h-9 text-[13px]"
                    aria-label="Urutan"
                  />
                  <label className="flex h-9 items-center gap-1.5 text-[12px] text-muted">
                    <input
                      type="checkbox"
                      name="is_active"
                      value="1"
                      defaultChecked={ministry.is_active}
                      className="h-4 w-4 accent-black"
                    />
                    Aktif
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="tnum text-[11px] text-subtle">
                      {headcount.get(ministry.id) ?? 0} orang
                    </span>
                    <button
                      type="submit"
                      className="h-9 rounded-md border border-line px-3 text-[12px] font-medium transition-colors hover:bg-surface"
                    >
                      Simpan
                    </button>
                  </div>
                </form>
              )}
            </li>
          ))}
        </ul>
      </Card>

      {!demo ? (
        <Card>
          <CardHeader
            title="Tambah kementerian"
            description="Urutan kecil tampil lebih dulu di form."
          />
          <form
            action={createMinistry}
            className="grid gap-2 p-3 sm:grid-cols-[1fr_100px_auto]"
          >
            <Input name="name" placeholder="Kementerian …" required />
            <Input
              name="sort_order"
              type="number"
              placeholder="Urutan"
              defaultValue={ministries.length + 1}
            />
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md bg-fg px-4 text-[13px] font-medium text-bg transition-colors hover:bg-black/85"
            >
              <Plus className="h-4 w-4" />
              Tambah
            </button>
          </form>
        </Card>
      ) : null}
    </div>
  );
}
