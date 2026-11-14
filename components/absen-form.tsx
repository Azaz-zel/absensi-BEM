"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertCircle,
  ArrowRight,
  Camera,
  Check,
  ChevronDown,
  ClipboardPaste,
  Loader2,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Badge, Button, Field, Input, Select, Textarea } from "@/components/ui";
import { compressPhoto } from "@/lib/image";
import { clearDraft, loadDraft, saveDraft } from "@/lib/draft";
import {
  formatDate,
  nameKey,
  shiftLabel,
  todayWIB,
} from "@/lib/format";
import type { Ministry, Person, SessionKind, Shift } from "@/lib/types";

const DRAFT_KEYS: Record<SessionKind, string> = {
  piket: "draft-absen-v1",
  proker: "draft-absen-proker-v1",
};

type Attendee = {
  key: string;
  personId: string | null;
  name: string;
  ministryId: string | null;
};

type Draft = {
  date: string;
  shift: Shift;
  prokerName: string;
  location: string;
  notes: string;
  attendees: Attendee[];
  consent: boolean;
  clientUuid: string;
  photo: Blob | null;
};

type SuccessInfo = {
  kind: SessionKind;
  date: string;
  shift: Shift | null;
  prokerName: string | null;
  count: number;
  merged: boolean;
  already: boolean;
  names: string[];
};

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function blankAttendee(ministryId: string | null = null): Attendee {
  return { key: uid(), personId: null, name: "", ministryId };
}

export function AbsenForm({
  kind = "piket",
  ministries,
  people,
  configured,
  officer = null,
  blockedReason = null,
}: {
  kind?: SessionKind;
  ministries: Ministry[];
  people: Person[];
  configured: boolean;
  officer?: { name: string; ministryId: string | null } | null;
  blockedReason?: string | null;
}) {
  const isProker = kind === "proker";
  const draftKey = DRAFT_KEYS[kind];
  const photoKey = `${draftKey}-photo`;
  const baseMinistryId = isProker ? officer?.ministryId ?? null : null;

  const [date, setDate] = useState(todayWIB());
  const [shift, setShift] = useState<Shift>("pagi");
  const [prokerName, setProkerName] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [attendees, setAttendees] = useState<Attendee[]>([
    blankAttendee(baseMinistryId),
  ]);
  const [consent, setConsent] = useState(false);
  const [clientUuid, setClientUuid] = useState(() => uid());

  const [photo, setPhoto] = useState<Blob | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<SuccessInfo | null>(null);
  const [restored, setRestored] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);
  const hydrated = useRef(false);

  /* ---------- Draft restore ---------- */

  useEffect(() => {
    let alive = true;
    (async () => {
      // The photo lives under its own key so typing never rewrites the blob.
      const [draft, storedPhoto] = await Promise.all([
        loadDraft<Draft>(draftKey),
        loadDraft<Blob>(photoKey),
      ]);
      if (!alive) return;
      hydrated.current = true;
      if (!draft) return;

      setDate(draft.date || todayWIB());
      setShift(draft.shift === "sore" ? "sore" : "pagi");
      setProkerName(draft.prokerName ?? "");
      setLocation(draft.location ?? "");
      setNotes(draft.notes ?? "");
      setAttendees(
        draft.attendees?.length
          ? isProker
            ? draft.attendees
            : draft.attendees.slice(0, 1) // piket: satu orang satu absen
          : [blankAttendee(baseMinistryId)],
      );
      setConsent(Boolean(draft.consent));
      setClientUuid(draft.clientUuid || uid());
      const photoBlob = storedPhoto ?? draft.photo;
      if (photoBlob instanceof Blob) {
        setPhoto(photoBlob);
        setPhotoUrl(URL.createObjectURL(photoBlob));
      }
      setRestored(true);
    })();
    return () => {
      alive = false;
    };
  }, [baseMinistryId, draftKey, photoKey, isProker]);

  /* ---------- Draft persist ---------- */

  useEffect(() => {
    if (!hydrated.current || success) return;
    const timer = setTimeout(() => {
      const draft: Draft = {
        date,
        shift,
        prokerName,
        location,
        notes,
        attendees,
        consent,
        clientUuid,
        photo: null,
      };
      void saveDraft(draftKey, draft);
    }, 500);
    return () => clearTimeout(timer);
  }, [
    date,
    shift,
    prokerName,
    location,
    notes,
    attendees,
    consent,
    clientUuid,
    success,
    draftKey,
  ]);

  // Photo changes are rare and the blob is large: write it only on change.
  useEffect(() => {
    if (!hydrated.current) return;
    if (photo) void saveDraft(photoKey, photo);
    else void clearDraft(photoKey);
  }, [photo, photoKey]);

  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  /* ---------- Attendees ---------- */

  const updateAttendee = useCallback((key: string, patch: Partial<Attendee>) => {
    setAttendees((list) =>
      list.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  }, []);

  const addAttendee = () => {
    setAttendees((list) => [...list, blankAttendee(baseMinistryId)]);
  };

  const removeAttendee = (key: string) => {
    setAttendees((list) =>
      list.length === 1
        ? [blankAttendee(baseMinistryId)]
        : list.filter((item) => item.key !== key),
    );
  };

  const applyPaste = () => {
    const lines = pasteText
      .split("\n")
      .map((line) => line.replace(/^\s*[\d.)-]+\s*/, "").trim())
      .filter(Boolean);

    if (!lines.length) return;

    const existing = new Set(
      attendees.map((a) => nameKey(a.name)).filter(Boolean),
    );

    const next: Attendee[] = [];
    for (const line of lines) {
      const key = nameKey(line);
      if (!key || existing.has(key)) continue;
      existing.add(key);
      const match = people.find((p) => nameKey(p.full_name) === key);
      next.push({
        key: uid(),
        personId: match?.id ?? null,
        name: match?.full_name ?? line,
        ministryId: match?.ministry_id ?? baseMinistryId,
      });
    }

    if (!next.length) return;
    setAttendees((list) => {
      const cleaned = list.filter((a) => a.name.trim() || a.personId);
      return [...cleaned, ...next];
    });
    setPasteText("");
    setPasteOpen(false);
  };

  /* ---------- Photo ---------- */

  const onPhoto = async (file: File | null) => {
    if (!file) return;
    setError(null);
    setPhotoBusy(true);
    try {
      const blob = await compressPhoto(file);
      if (photoUrl) URL.revokeObjectURL(photoUrl);
      setPhoto(blob);
      setPhotoUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memproses foto.");
    } finally {
      setPhotoBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removePhoto = () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhoto(null);
    setPhotoUrl(null);
  };

  /* ---------- Validation + submit ---------- */

  const validate = (): string | null => {
    if (!date) return "Tanggal wajib diisi.";
    if (date > todayWIB()) return "Tanggal tidak boleh di masa depan.";
    if (isProker) {
      if (!prokerName.trim()) return "Nama proker wajib diisi.";
      if (!location.trim()) return "Lokasi proker wajib diisi.";
      if (!officer) return "Sesi login tidak ditemukan. Masuk ulang.";
    } else if (!attendees[0]?.name.trim()) {
      return "Nama wajib diisi.";
    }
    if (!attendees.some((a) => a.name.trim()))
      return isProker
        ? "Isi minimal satu nama yang hadir."
        : "Isi minimal satu nama yang piket.";
    if (attendees.some((a) => a.name.trim() && !a.ministryId))
      return "Setiap nama harus punya kementerian.";
    if (!photo) return "Foto bukti wajib dilampirkan.";
    if (!consent) return "Centang persetujuan penggunaan foto.";
    return null;
  };

  const submit = async () => {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    if (!configured) {
      setError(
        blockedReason ?? "Supabase belum terhubung. Hubungi admin.",
      );
      return;
    }

    setError(null);
    setSubmitting(true);

    const clean = attendees.filter((a) => a.name.trim());
    const payload = {
      clientUuid,
      kind,
      date,
      shift: isProker ? null : shift,
      prokerName: isProker ? prokerName.trim() : null,
      location: location.trim() || null,
      notes: notes.trim() || null,
      submitterName: isProker ? officer?.name ?? "" : clean[0]?.name.trim() ?? "",
      consent: true,
      website: (document.getElementById("website") as HTMLInputElement | null)
        ?.value,
      attendees: clean.map((a) => ({
        personId: a.personId,
        name: a.name.trim(),
        ministryId: a.ministryId,
      })),
    };

    const form = new FormData();
    form.set("payload", JSON.stringify(payload));
    form.set("photo", photo as Blob, "bukti.jpg");

    try {
      const res = await fetch("/api/absen", { method: "POST", body: form });
      const json = await res.json();

      if (!res.ok) {
        setError(json?.message ?? "Gagal menyimpan absen. Coba lagi.");
        return;
      }

      setSuccess({
        kind,
        date,
        shift: isProker ? null : shift,
        prokerName: isProker ? prokerName.trim() : null,
        count: clean.length,
        merged: Boolean(json.merged),
        already: Boolean(json.already),
        names: clean.map((a) => a.name.trim()),
      });
      await clearDraft(draftKey);
    } catch {
      setError(
        "Koneksi terputus. Isianmu tersimpan — tekan Kirim lagi saat sinyal kembali.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSuccess(null);
    setError(null);
    setRestored(false);
    setDate(todayWIB());
    setShift("pagi");
    setProkerName("");
    setLocation("");
    setNotes("");
    setAttendees([blankAttendee(baseMinistryId)]);
    setConsent(false);
    setPasteText("");
    setPasteOpen(false);
    removePhoto();
    setClientUuid(uid());
  };

  /* ---------- Success screen ---------- */

  if (success) {
    return (
      <SuccessScreen
        info={success}
        onAgain={resetForm}
      />
    );
  }

  /* ---------- Form ---------- */

  return (
    <div className="space-y-4">
      {!configured ? (
        <Notice tone="warn">
          {blockedReason ??
            "Supabase belum dikonfigurasi. Form bisa diisi, tapi belum bisa dikirim."}
        </Notice>
      ) : null}

      {restored ? (
        <Notice tone="neutral">
          Isian sebelumnya dipulihkan otomatis.
          <button
            type="button"
            onClick={() => setRestored(false)}
            className="ml-2 underline underline-offset-2 hover:text-fg"
          >
            Tutup
          </button>
        </Notice>
      ) : null}

      {/* Sesi */}
      <Section title={isProker ? "Detail proker" : "Sesi piket"} step="01">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Tanggal" htmlFor="date" required>
            <Input
              id="date"
              type="date"
              value={date}
              max={todayWIB()}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          {isProker ? (
            <Field label="Nama proker" htmlFor="proker" required>
              <Input
                id="proker"
                value={prokerName}
                onChange={(e) => setProkerName(e.target.value)}
                placeholder="Pameran Inovasi Mahasiswa"
              />
            </Field>
          ) : (
            <Field label="Shift" required>
              <div className="grid h-10 grid-cols-2 gap-1 rounded-md border border-line bg-surface p-1">
                {(["pagi", "sore"] as Shift[]).map((value) => {
                  const active = shift === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setShift(value)}
                      className={cn(
                        "inline-flex items-center justify-center gap-1.5 rounded-[5px] text-[13px] font-medium transition-colors",
                        active
                          ? "bg-fg text-bg shadow-sm"
                          : "text-muted hover:bg-bg hover:text-fg",
                      )}
                      aria-pressed={active}
                    >
                      <Check
                        aria-hidden
                        className={cn(
                          "h-3.5 w-3.5 transition-opacity",
                          active ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {shiftLabel(value)}
                    </button>
                  );
                })}
              </div>
            </Field>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label={isProker ? "Lokasi proker" : "Lokasi"}
            htmlFor="location"
            required={isProker}
            hint={isProker ? undefined : "Opsional"}
          >
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={
                isProker ? "Aula Fakultas Teknik" : "Sekretariat BEM"
              }
            />
          </Field>
          <Field label="Keterangan" htmlFor="notes" hint="Opsional">
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                isProker ? "Jumlah peserta, rundown" : "Jaga stand BEM"
              }
            />
          </Field>
        </div>
      </Section>

      {/* Pengabsen */}
      {isProker ? (
        <Section title="Kamu yang mengisi" step="02">
          <div className="rounded-md border border-line bg-surface px-3 py-2.5">
            <p className="text-[13px] font-medium">{officer?.name ?? "—"}</p>
            <p className="mt-0.5 text-[11px] text-muted">
              Tercatat sebagai akun menteri/wakil menteri yang sedang login.
            </p>
          </div>
        </Section>
      ) : (
        <Section title="Kamu yang mengisi" step="02">
          <AttendeeRow
            index={0}
            attendee={attendees[0]}
            people={people}
            ministries={ministries}
            canRemove={false}
            single
            onChange={(patch) => updateAttendee(attendees[0].key, patch)}
          />
        </Section>
      )}

      {/* Yang hadir (proker only) */}
      {isProker ? (
      <Section
        title="Yang hadir"
        step="03"
        action={
          <button
            type="button"
            onClick={() => setPasteOpen((v) => !v)}
            aria-expanded={pasteOpen}
            className="inline-flex h-7 items-center gap-1.5 rounded-md px-1.5 -mr-1.5 text-[12px] font-medium text-muted transition-colors hover:bg-surface hover:text-fg"
          >
            <ClipboardPaste className="h-3.5 w-3.5" />
            Tempel banyak nama
          </button>
        }
      >
        {pasteOpen ? (
          <div className="rounded-md border border-line bg-surface p-3">
            <p className="mb-2 text-[12px] text-muted">
              Satu nama per baris. Nama yang cocok dengan roster otomatis dapat
              kementeriannya.
            </p>
            <Textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              aria-label="Daftar nama, satu per baris"
              placeholder={"I Gede Govinda Adi Utama\nPutu Dewi Arma Elysa Putri"}
              className="bg-bg"
            />
            <div className="mt-2 flex justify-end gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setPasteOpen(false)}
              >
                Batal
              </Button>
              <Button type="button" size="sm" onClick={applyPaste}>
                Tambahkan
              </Button>
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          {attendees.map((attendee, index) => (
            <AttendeeRow
              key={attendee.key}
              index={index}
              attendee={attendee}
              people={people}
              ministries={ministries}
              canRemove={attendees.length > 1}
              onChange={(patch) => updateAttendee(attendee.key, patch)}
              onRemove={() => removeAttendee(attendee.key)}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={addAttendee}
          className="flex h-10 w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-line text-[13px] font-medium text-muted transition-colors hover:border-line-strong hover:bg-surface hover:text-fg"
        >
          <Plus className="h-4 w-4" />
          Tambah orang
        </button>

        <p className="text-[12px] text-subtle">
          {attendees.filter((a) => a.name.trim()).length} orang tercatat
        </p>
      </Section>
      ) : null}

      {/* Bukti */}
      <Section title="Foto bukti" step={isProker ? "04" : "03"}>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          tabIndex={-1}
          aria-hidden
          className="sr-only"
          onChange={(e) => onPhoto(e.target.files?.[0] ?? null)}
        />

        {photoUrl ? (
          <div className="relative overflow-hidden rounded-md border border-line bg-surface">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl}
              alt="Pratinjau foto bukti"
              className="max-h-72 w-full object-cover"
            />
            <div className="absolute right-2 top-2 flex gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="grid h-8 w-8 place-items-center rounded-md bg-bg/90 text-fg backdrop-blur transition-colors hover:bg-bg"
                aria-label="Ganti foto"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={removePhoto}
                className="grid h-8 w-8 place-items-center rounded-md bg-bg/90 text-danger backdrop-blur transition-colors hover:bg-bg"
                aria-label="Hapus foto"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={photoBusy}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-line px-4 py-10 text-muted transition-colors hover:border-line-strong hover:bg-surface hover:text-fg disabled:opacity-60"
          >
            {photoBusy ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Camera className="h-5 w-5" />
            )}
            <span className="text-[13px] font-medium">
              {photoBusy ? "Memproses foto…" : "Ambil atau pilih foto"}
            </span>
            <span className="text-[12px] text-subtle">
              Foto dikompres otomatis, metadata lokasi dibuang
            </span>
          </button>
        )}
      </Section>

      {/* Persetujuan */}
      <label className="flex cursor-pointer items-start gap-3 rounded-card border border-line bg-surface p-3">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-black"
        />
        <span className="text-[12px] leading-relaxed text-muted">
          Saya setuju foto dan nama digunakan sebagai bukti{" "}
          {isProker ? "kegiatan" : "piket"} internal BEM PM INSTIKI. Foto
          disimpan maksimal 12 bulan.
        </span>
      </label>

      <input
        id="website"
        name="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="pointer-events-none absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      {error ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-danger/25 bg-danger/5 px-3 py-2.5 text-[12px] text-danger"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="sticky bottom-0 -mx-4 border-t border-line bg-bg/90 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
        <Button
          type="button"
          onClick={submit}
          disabled={submitting || !configured}
          className="h-11 w-full text-[15px] sm:h-10 sm:text-sm"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Mengirim…
            </>
          ) : (
            <>
              Kirim absen
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
        <p className="mt-2 text-center text-[12px] text-subtle sm:hidden">
          Isian tersimpan otomatis di perangkat ini
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   Attendee row + name combobox
   ============================================================ */

function AttendeeRow({
  index,
  attendee,
  people,
  ministries,
  canRemove,
  single = false,
  onChange,
  onRemove,
}: {
  index: number;
  attendee: Attendee;
  people: Person[];
  ministries: Ministry[];
  canRemove: boolean;
  single?: boolean;
  onChange: (patch: Partial<Attendee>) => void;
  onRemove?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const ministryName = useMemo(() => {
    const map = new Map(ministries.map((m) => [m.id, m.name]));
    return map;
  }, [ministries]);

  const query = nameKey(attendee.name);

  // Nama yang ditawarkan mengikuti kementerian yang sudah dipilih.
  const pool = useMemo(
    () =>
      attendee.ministryId
        ? people.filter((p) => p.ministry_id === attendee.ministryId)
        : people,
    [attendee.ministryId, people],
  );

  const matches = useMemo(() => {
    const q = nameKey(attendee.name);
    // Empty query: browse the roster (or the chosen ministry). Typing narrows it.
    if (!q) return pool;
    return pool.filter((p) => nameKey(p.full_name).includes(q)).slice(0, 30);
  }, [attendee.name, pool]);

  const choose = (person: Person) => {
    onChange({
      personId: person.id,
      name: person.full_name,
      ministryId: person.ministry_id ?? attendee.ministryId,
    });
    setOpen(false);
  };

  return (
    <div className="rounded-md border border-line p-2.5">
      <div className="flex items-start gap-2">
        {single ? null : (
          <span className="tnum mt-2.5 w-5 shrink-0 text-2xs text-subtle">
            {String(index + 1).padStart(2, "0")}
          </span>
        )}

        <div className="min-w-0 flex-1 space-y-2">
          <div className="relative">
            <Input
              value={attendee.name}
              onChange={(e) => {
                onChange({ name: e.target.value, personId: null });
                setOpen(true);
                setActive(0);
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 120)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setOpen(true);
                  setActive((i) => Math.min(i + 1, matches.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActive((i) => Math.max(i - 1, 0));
                } else if (e.key === "Enter" && open && matches[active]) {
                  e.preventDefault();
                  choose(matches[active]);
                } else if (e.key === "Escape") {
                  setOpen(false);
                }
              }}
              placeholder="Pilih atau ketik nama…"
              autoComplete="off"
              autoCapitalize="words"
              aria-label={single ? "Nama kamu" : `Nama orang ${index + 1}`}
              className="h-9 pr-8"
              role="combobox"
              aria-expanded={open}
              aria-autocomplete="list"
              aria-controls={`roster-${index}`}
              aria-activedescendant={
                open && matches[active]
                  ? `roster-${index}-${matches[active].id}`
                  : undefined
              }
            />
            <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-subtle" />

            {open ? (
              <div
                id={`roster-${index}`}
                role="listbox"
                aria-label="Pilih dari roster"
                className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-md border border-line bg-bg py-1 shadow-pop"
              >
                <p className="sticky top-0 -mt-1 border-b border-line bg-bg px-3 py-1.5 text-[11px] text-subtle">
                  {query
                    ? `${matches.length} nama cocok`
                    : attendee.ministryId
                      ? `${matches.length} orang · ketik untuk mencari`
                      : `${people.length} orang di roster · ketik untuk mencari`}
                </p>
                {matches.length ? (
                  matches.map((person, i) => (
                    <button
                      key={person.id}
                      id={`roster-${index}-${person.id}`}
                      type="button"
                      role="option"
                      aria-selected={i === active}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => choose(person)}
                      className={cn(
                        "flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left transition-colors",
                        i === active ? "bg-surface" : "hover:bg-surface",
                      )}
                    >
                      <span className="text-[13px] font-medium">
                        {person.full_name}
                      </span>
                      <span className="text-[11px] text-subtle">
                        {person.ministry_id
                          ? ministryName.get(person.ministry_id)
                          : "Tanpa kementerian"}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-2 text-[12px] text-muted">
                    {attendee.ministryId
                      ? "Belum ada nama itu di kementerian ini. Ketik nama baru atau ganti kementerian."
                      : "Nama belum ada di roster. Pilih kementerian di bawah."}
                  </p>
                )}
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={attendee.ministryId ?? ""}
              onChange={(e) => {
                const ministryId = e.target.value || null;
                // Daftar nama ikut kementerian; jangan sisakan sorotan lama.
                setActive(0);
                onChange({ ministryId });
              }}
              className="h-9 text-[13px]"
              aria-label="Kementerian"
            >
              <option value="">Pilih kementerian…</option>
              {ministries.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>

            {single ? null : (
            <button
              type="button"
              onClick={onRemove}
              disabled={!canRemove}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-line text-subtle transition-colors hover:border-danger/30 hover:text-danger disabled:opacity-40"
              aria-label={`Hapus orang ${index + 1}`}
            >
              <X className="h-4 w-4" />
            </button>
            )}
          </div>

          {attendee.personId ? (
            <p className="flex items-center gap-1 text-[11px] text-success">
              <Check className="h-3 w-3" /> Cocok dengan roster
            </p>
          ) : attendee.name.trim() ? (
            <p className="text-[11px] text-warn">
              Nama baru — masuk antrean persetujuan admin
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Layout helpers
   ============================================================ */

function Section({
  title,
  step,
  action,
  children,
}: {
  title: string;
  step: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-card border border-line bg-bg p-3.5 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className="tnum text-2xs font-medium text-subtle">{step}</span>
          <h2 className="text-[13px] font-semibold tracking-tight">{title}</h2>
        </div>
        {action}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Notice({
  tone,
  children,
}: {
  tone: "warn" | "neutral";
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-md border px-3 py-2.5 text-[12px]",
        tone === "warn"
          ? "border-warn/25 bg-warn/5 text-warn"
          : "border-line bg-surface text-muted",
      )}
    >
      {children}
    </div>
  );
}

function SuccessScreen({
  info,
  onAgain,
}: {
  info: SuccessInfo;
  onAgain: () => void;
}) {
  return (
    <div className="rounded-card border border-line bg-bg">
      <div className="flex flex-col items-center px-5 py-10 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-success-soft text-success">
          <Check className="h-6 w-6" />
        </span>
        <h2 className="mt-4 text-[17px] font-semibold tracking-tight">
          {info.already ? "Sesi ini sudah kamu isi" : "Absen tercatat"}
        </h2>
        <p className="mt-1 max-w-sm text-[13px] text-muted">
          {info.already
            ? "Tidak ada data baru yang ditambahkan, jadi tidak terjadi duplikat."
            : info.merged
              ? "Sesi ini sudah ada, nama yang kamu tambahkan digabungkan."
              : "Terima kasih. Data menunggu verifikasi admin."}
        </p>

        <dl className="mt-6 w-full max-w-sm divide-y divide-line rounded-md border border-line text-left text-[13px]">
          <div className="flex items-center justify-between px-3 py-2.5">
            <dt className="text-muted">Tanggal</dt>
            <dd className="font-medium">{formatDate(info.date)}</dd>
          </div>
          {info.kind === "proker" ? (
            <div className="flex items-center justify-between gap-3 px-3 py-2.5">
              <dt className="shrink-0 text-muted">Proker</dt>
              <dd className="truncate text-right font-medium">
                {info.prokerName}
              </dd>
            </div>
          ) : (
            <div className="flex items-center justify-between px-3 py-2.5">
              <dt className="text-muted">Shift</dt>
              <dd className="font-medium">{shiftLabel(info.shift)}</dd>
            </div>
          )}
          <div className="flex items-center justify-between px-3 py-2.5">
            <dt className="text-muted">Jumlah</dt>
            <dd className="tnum font-medium">{info.count} orang</dd>
          </div>
          <div className="flex items-center justify-between px-3 py-2.5">
            <dt className="text-muted">Status</dt>
            <dd>
              <Badge tone="warn">Menunggu verifikasi</Badge>
            </dd>
          </div>
        </dl>

        {info.names.length ? (
          <p className="mt-4 text-[12px] leading-relaxed text-subtle">
            {info.names.join(" · ")}
          </p>
        ) : null}

        <Button onClick={onAgain} variant="secondary" className="mt-6">
          Isi sesi lain
        </Button>
      </div>
    </div>
  );
}
