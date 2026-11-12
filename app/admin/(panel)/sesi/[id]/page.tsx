import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  MapPin,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Badge, Button, Card, CardHeader, Separator } from "@/components/ui";
import { StatusBadge } from "@/components/admin/status-badge";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { deleteSession, verifySession } from "@/app/admin/actions";
import { loadSessionDetail, isDemoMode } from "@/lib/admin-data";
import { formatDate, formatDateTime, shiftLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await loadSessionDetail(id);
  if (!detail) notFound();

  const demo = isDemoMode();
  const { session } = detail;
  const byMinistry = new Map<string, typeof detail.attendees>();
  for (const attendee of detail.attendees) {
    const list = byMinistry.get(attendee.ministry) ?? [];
    list.push(attendee);
    byMinistry.set(attendee.ministry, list);
  }

  return (
    <div className="space-y-4">
      <Link
        href={`/admin/sesi/${session.kind}`}
        className="inline-flex items-center gap-1.5 text-[12px] text-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {session.kind === "proker" ? "Sesi proker" : "Sesi piket"}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[20px] font-semibold tracking-tight">
              {formatDate(session.date)}
            </h1>
            <Badge tone="accent">
              {session.kind === "proker"
                ? "Proker"
                : `Shift ${shiftLabel(session.shift)}`}
            </Badge>
            <StatusBadge status={session.status} />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted">
            {session.kind === "proker" && session.proker_name ? (
              <span className="font-medium text-fg">{session.proker_name}</span>
            ) : null}
            {session.location ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {session.location}
              </span>
            ) : null}
            <span>{detail.attendees.length} orang</span>
            {session.notes ? <span>{session.notes}</span> : null}
          </div>
        </div>

        {!demo ? (
          <div className="flex items-center gap-2">
            <form action={verifySession}>
              <input type="hidden" name="id" value={session.id} />
              <input
                type="hidden"
                name="verified"
                value={session.status === "verified" ? "0" : "1"}
              />
              <Button variant="secondary" size="sm" type="submit">
                {session.status === "verified" ? (
                  <>
                    <RotateCcw className="h-3.5 w-3.5" />
                    Batalkan verifikasi
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Verifikasi
                  </>
                )}
              </Button>
            </form>

            <form action={deleteSession}>
              <input type="hidden" name="id" value={session.id} />
              <ConfirmButton
                message="Hapus sesi ini? Sesi disembunyikan dari dashboard, data tetap tersimpan."
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line px-3 text-[13px] font-medium text-danger transition-colors hover:border-danger/40 hover:bg-danger/5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Hapus
              </ConfirmButton>
            </form>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader
              title={session.kind === "proker" ? "Yang hadir" : "Yang piket"}
              description={`${detail.attendees.length} orang · ${byMinistry.size} kementerian`}
            />
            {detail.attendees.length ? (
              <div className="divide-y divide-line">
                {[...byMinistry.entries()].map(([ministry, attendees]) => (
                  <div key={ministry} className="px-4 py-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-[11px] font-medium uppercase tracking-[0.05em] text-subtle">
                        {ministry.replace("Kementerian ", "")}
                      </p>
                      <span className="tnum text-2xs text-subtle">
                        {attendees.length}
                      </span>
                    </div>
                    <ul className="space-y-1.5">
                      {attendees.map((attendee) => (
                        <li
                          key={attendee.personId}
                          className="flex items-baseline justify-between gap-3"
                        >
                          <span className="text-[13px]">{attendee.name}</span>
                          {attendee.nim ? (
                            <span className="tnum text-[11px] text-subtle">
                              {attendee.nim}
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-4 py-8 text-center text-[12px] text-subtle">
                Data kehadiran tidak tersedia pada mode demo.
              </p>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Riwayat pengisian"
              description={`${detail.submissions.length} submission`}
            />
            {detail.submissions.length ? (
              <ul className="divide-y divide-line">
                {detail.submissions.map((submission) => (
                  <li
                    key={submission.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium">
                        {submission.submitter_name}
                      </p>
                      <p className="text-[11px] text-subtle">
                        {formatDateTime(submission.created_at)}
                      </p>
                    </div>
                    <StatusBadge status={submission.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-8 text-center text-[12px] text-subtle">
                Belum ada submission.
              </p>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Foto bukti"
              description={`${detail.submissions.filter((s) => s.photoUrl).length} foto`}
            />
            {detail.submissions.some((s) => s.photoUrl) ? (
              <div className="space-y-2 p-3">
                {detail.submissions.map((submission) =>
                  submission.photoUrl ? (
                    <a
                      key={submission.id}
                      href={submission.photoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="group relative block overflow-hidden rounded-md border border-line bg-surface"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={submission.photoUrl}
                        alt={`Bukti dari ${submission.submitter_name}`}
                        className="max-h-[360px] w-full object-cover transition-transform group-hover:scale-[1.01]"
                      />
                      <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-md bg-bg/90 text-fg opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </span>
                    </a>
                  ) : null,
                )}
              </div>
            ) : (
              <div className="px-4 py-10 text-center text-[12px] text-subtle">
                Tidak ada foto pada sesi ini.
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Metadata" />
            <dl className="space-y-2.5 p-4 text-[12px]">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Jenis</dt>
                <dd>
                  {session.kind === "proker"
                    ? session.proker_name ?? "Proker"
                    : `Piket ${shiftLabel(session.shift)}`}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Dibuat</dt>
                <dd className="text-right">{formatDateTime(session.created_at)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Sumber</dt>
                <dd>{detail.submissions.length} pengabsen</dd>
              </div>
              <Separator />
              <div className="flex justify-between gap-3">
                <dt className="text-muted">ID sesi</dt>
                <dd className="truncate font-mono text-[10px] text-subtle">
                  {session.id}
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
