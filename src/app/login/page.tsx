"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/layout/Logo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // The /auth/callback redirects here with ?error=auth if a code exchange failed.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("error") === "auth") {
      setError("Sign-in failed or the link expired. Please try again.");
    }
  }, []);

  async function authenticate(mode: "login" | "signup") {
    setError(null);
    setNotice(null);
    setPending(true);
    const supabase = createClient();

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        setError(error.message);
        setPending(false);
        return;
      }
      // When email confirmation is on, no session comes back yet.
      if (!data.session) {
        setNotice("Almost there — check your email to confirm your account.");
        setPending(false);
        return;
      }
      window.location.assign("/");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setPending(false);
      return;
    }
    // Full navigation so the middleware picks up the new session cookie.
    window.location.assign("/");
  }

  async function sendReset() {
    if (!email) {
      setError("Enter your email above first, then tap “Forgot password”.");
      return;
    }
    setError(null);
    setNotice(null);
    setPending(true);
    const { error } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset`,
    });
    setPending(false);
    if (error) {
      setError(error.message);
      return;
    }
    setNotice("Password reset link sent — check your email.");
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 p-4 pt-12 sm:p-6 sm:pt-16">
      <div className="flex flex-col items-center text-center">
        <Logo className="mb-3 h-9 w-9 text-primary" />
        <h1 className="text-2xl font-bold">Welcome to ranking.place</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in or create an account to start your map.
        </p>
      </div>

      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          authenticate("login");
        }}
      >
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="flex items-center justify-between">
            Password
            <button
              type="button"
              onClick={sendReset}
              className="text-xs font-normal text-muted-foreground hover:text-primary"
            >
              Forgot password?
            </button>
          </span>
          <input
            type="password"
            required
            minLength={6}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {notice && (
          <p className="rounded-lg border border-leaf/40 bg-leaf/10 p-3 text-sm text-foreground">
            {notice}
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending}
            className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => authenticate("signup")}
            disabled={pending}
            className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
          >
            Sign up
          </button>
        </div>
      </form>
    </div>
  );
}
