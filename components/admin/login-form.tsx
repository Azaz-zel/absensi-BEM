"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button, Field, Input } from "@/components/ui";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm({
  fallback = "/admin",
  allowPrefix = "/admin",
}: {
  fallback?: string;
  allowPrefix?: string;
} = {}) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? fallback;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);

    const supabase = createSupabaseBrowserClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError(
        authError.message.toLowerCase().includes("invalid")
          ? "Email atau password salah."
          : authError.message,
      );
      setBusy(false);
      return;
    }

    router.replace(next.startsWith(allowPrefix) ? next : fallback);
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Email" htmlFor="email" required>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nama@email.com"
          autoComplete="email"
          required
        />
      </Field>

      <Field label="Password" htmlFor="password" required>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
      </Field>

      {error ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-danger/25 bg-danger/5 px-3 py-2 text-[12px] text-danger"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <Button type="submit" disabled={busy} className="h-10 w-full">
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Memeriksa…
          </>
        ) : (
          "Masuk"
        )}
      </Button>
    </form>
  );
}
