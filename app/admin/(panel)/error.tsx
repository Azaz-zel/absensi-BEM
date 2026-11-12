"use client";

import { Button } from "@/components/ui";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-card border border-line bg-bg p-8 text-center">
      <h1 className="text-[15px] font-semibold">Gagal memuat data</h1>
      <p className="mx-auto mt-1 max-w-md text-[12px] leading-relaxed text-muted">
        {error.message || "Terjadi kesalahan saat menghubungi Supabase."}
      </p>
      <Button variant="secondary" onClick={reset} className="mt-4">
        Coba lagi
      </Button>
    </div>
  );
}
