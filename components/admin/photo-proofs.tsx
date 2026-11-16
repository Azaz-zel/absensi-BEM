"use client";

import { useState } from "react";
import { ExternalLink, Images } from "lucide-react";
import { formatDateTime } from "@/lib/format";

export type PhotoProof = {
  id: string;
  name: string;
  createdAt: string;
  url: string;
};

/** Foto yang tampil sebelum tombol "Lihat semua foto" ditekan. */
const PREVIEW_COUNT = 3;

export function PhotoProofs({ photos }: { photos: PhotoProof[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? photos : photos.slice(0, PREVIEW_COUNT);
  const remaining = photos.length - visible.length;

  return (
    <div className="space-y-2 p-3">
      <div
        className={
          expanded
            ? "grid gap-2 sm:grid-cols-2"
            : "grid grid-cols-3 gap-2"
        }
      >
        {visible.map((photo) => (
          <figure
            key={photo.id}
            className="overflow-hidden rounded-md border border-line bg-bg"
          >
            <a
              href={photo.url}
              target="_blank"
              rel="noreferrer"
              title={`Bukti dari ${photo.name}`}
              className="group relative block bg-surface"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={`Bukti dari ${photo.name}`}
                loading="lazy"
                className={
                  expanded
                    ? "h-52 w-full object-cover transition-transform group-hover:scale-[1.01]"
                    : "aspect-[4/3] w-full object-cover transition-transform group-hover:scale-[1.01]"
                }
              />
              <span className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-md bg-bg/90 text-fg opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                <ExternalLink className="h-3 w-3" />
              </span>
            </a>
            <figcaption
              className={
                expanded
                  ? "border-t border-line px-3 py-2"
                  : "border-t border-line px-2 py-1.5"
              }
            >
              <span
                title={photo.name}
                className={
                  expanded
                    ? "line-clamp-2 text-[11px] text-muted"
                    : "block truncate text-[10px] text-muted"
                }
              >
                <span className="font-medium text-fg">{photo.name}</span>
              </span>
              {expanded ? (
                <span className="block text-[10px] text-subtle">
                  {formatDateTime(photo.createdAt)}
                </span>
              ) : null}
            </figcaption>
          </figure>
        ))}
      </div>

      {photos.length > PREVIEW_COUNT ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md border border-line bg-bg px-3 text-[12px] font-medium text-muted transition-colors hover:bg-surface hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-expanded={expanded}
        >
          <Images className="h-3.5 w-3.5" />
          {expanded
            ? "Sembunyikan foto"
            : `Lihat semua foto (${remaining} lagi)`}
        </button>
      ) : null}
    </div>
  );
}
