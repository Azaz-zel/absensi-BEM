"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Menyegarkan server components secara berkala supaya data absen baru
 * muncul tanpa reload manual.
 */
export function AutoRefresh({ intervalMs = 10_000 }: { intervalMs?: number }) {
  const router = useRouter();
  const refreshing = useRef(false);

  useEffect(() => {
    const tick = () => {
      if (refreshing.current || document.visibilityState !== "visible") return;
      refreshing.current = true;
      router.refresh();
      // router.refresh tidak memberi sinyal selesai; beri jeda agar tidak menumpuk.
      window.setTimeout(() => {
        refreshing.current = false;
      }, 2000);
    };

    const id = window.setInterval(tick, intervalMs);
    const onFocus = () => tick();
    window.addEventListener("focus", onFocus);

    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [router, intervalMs]);

  return null;
}
