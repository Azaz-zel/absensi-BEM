"use client";

import { useState } from "react";
import { CheckCircle2, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui";
import { StatusBadge } from "@/components/admin/status-badge";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { formatDateTime } from "@/lib/format";
import { deleteSubmissions, verifySubmissions } from "@/app/admin/actions";
import type { SessionStatus } from "@/lib/types";

export type SubmissionItem = {
  id: string;
  submitter_name: string;
  created_at: string;
  status: SessionStatus;
  photoUrl: string | null;
};

const iconButton =
  "grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-surface hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

export function SubmissionsManager({
  sessionId,
  submissions,
}: {
  sessionId: string;
  submissions: SubmissionItem[];
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const allIds = submissions.map((submission) => submission.id);
  const allSelected =
    allIds.length > 0 && selected.length === allIds.length;
  const someSelected = selected.length > 0 && !allSelected;
  const unverified = submissions.filter(
    (submission) => submission.status !== "verified",
  ).length;

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line px-4 py-2.5">
        <label className="flex items-center gap-2 text-[12px] text-muted">
          <input
            type="checkbox"
            className="h-4 w-4 accent-black"
            checked={allSelected}
            ref={(input) => {
              if (input) input.indeterminate = someSelected;
            }}
            onChange={() => setSelected(allSelected ? [] : allIds)}
            aria-label="Pilih semua submission"
          />
          Pilih semua
        </label>
        <span className="tnum text-[11px] text-subtle">
          {selected.length} dipilih
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {unverified > 0 ? (
            <form action={verifySubmissions}>
              <input type="hidden" name="session_id" value={sessionId} />
              <input type="hidden" name="verified" value="1" />
              <input type="hidden" name="all" value="1" />
              <Button variant="secondary" size="sm" type="submit">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Verifikasi semua
              </Button>
            </form>
          ) : null}

          {selected.length > 0 ? (
            <>
              <form action={verifySubmissions}>
                <input type="hidden" name="session_id" value={sessionId} />
                <input type="hidden" name="verified" value="1" />
                {selected.map((id) => (
                  <input
                    key={id}
                    type="hidden"
                    name="submission_id"
                    value={id}
                  />
                ))}
                <Button variant="secondary" size="sm" type="submit">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Verifikasi ({selected.length})
                </Button>
              </form>

              <form action={deleteSubmissions}>
                <input type="hidden" name="session_id" value={sessionId} />
                {selected.map((id) => (
                  <input
                    key={id}
                    type="hidden"
                    name="submission_id"
                    value={id}
                  />
                ))}
                <ConfirmButton
                  message={`Hapus ${selected.length} kiriman terpilih? Foto buktinya ikut terhapus.`}
                  className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-line px-3 text-[13px] font-medium text-danger transition-colors hover:border-danger/40 hover:bg-danger/5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Hapus ({selected.length})
                </ConfirmButton>
              </form>
            </>
          ) : null}
        </div>
      </div>

      <ul className="divide-y divide-line">
        {submissions.map((submission) => (
          <li
            key={submission.id}
            className="flex items-center gap-2 px-4 py-2.5 sm:gap-3"
          >
            <input
              type="checkbox"
              className="h-4 w-4 shrink-0 accent-black"
              checked={selected.includes(submission.id)}
              onChange={() => toggle(submission.id)}
              aria-label={`Pilih ${submission.submitter_name}`}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium">
                {submission.submitter_name}
              </p>
              <p className="text-[11px] text-subtle">
                {formatDateTime(submission.created_at)}
              </p>
            </div>
            <StatusBadge status={submission.status} />

            <form action={verifySubmissions}>
              <input type="hidden" name="session_id" value={sessionId} />
              <input
                type="hidden"
                name="submission_id"
                value={submission.id}
              />
              <input
                type="hidden"
                name="verified"
                value={submission.status === "verified" ? "0" : "1"}
              />
              <button
                type="submit"
                className={iconButton}
                title={
                  submission.status === "verified"
                    ? "Batalkan verifikasi"
                    : "Verifikasi kiriman ini"
                }
                aria-label={
                  submission.status === "verified"
                    ? `Batalkan verifikasi ${submission.submitter_name}`
                    : `Verifikasi ${submission.submitter_name}`
                }
              >
                {submission.status === "verified" ? (
                  <RotateCcw className="h-3.5 w-3.5" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
              </button>
            </form>

            <form action={deleteSubmissions}>
              <input type="hidden" name="session_id" value={sessionId} />
              <input
                type="hidden"
                name="submission_id"
                value={submission.id}
              />
              <ConfirmButton
                message={`Hapus kiriman ${submission.submitter_name}? Foto buktinya ikut terhapus.`}
                className={`${iconButton} hover:bg-danger/5 hover:text-danger`}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="sr-only">
                  Hapus kiriman {submission.submitter_name}
                </span>
              </ConfirmButton>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
