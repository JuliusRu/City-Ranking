"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    // The recovery session was established by the /auth/callback exchange when
    // the user clicked the email link, so updateUser sets the new password.
    const { error } = await createClient().auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setPending(false);
      return;
    }
    setDone(true);
    setTimeout(() => window.location.assign("/"), 1200);
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 p-4 pt-12 sm:p-6 sm:pt-16">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Set a new password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a new password for your account.
        </p>
      </div>

      {done ? (
        <p className="rounded-lg border border-leaf/40 bg-leaf/10 p-3 text-center text-sm text-foreground">
          Password updated — signing you in…
        </p>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={submit}>
          <label className="flex flex-col gap-1 text-sm">
            New password
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-gradient-brand px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Saving…" : "Update password"}
          </button>
        </form>
      )}
    </div>
  );
}
