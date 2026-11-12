"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton({
  compact = false,
  redirectTo = "/admin/login",
}: {
  compact?: boolean;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const signOut = async () => {
    setBusy(true);
    // The Supabase browser client is only needed on click; keep it out of
    // the admin shell's first load.
    const { createSupabaseBrowserClient } = await import(
      "@/lib/supabase/client"
    );
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace(redirectTo);
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={busy}
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] text-muted transition-colors hover:bg-surface hover:text-fg disabled:opacity-50"
    >
      <LogOut className="h-3.5 w-3.5" />
      {compact ? null : <span>Keluar</span>}
    </button>
  );
}
