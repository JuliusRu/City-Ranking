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

  async function signInWithGoogle() {
    setError(null);
    setNotice(null);
    setPending(true);
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    // On success the browser is redirected to Google; only errors land here.
    if (error) {
      setError(error.message);
      setPending(false);
    }
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

      {/* Google */}
      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={pending}
        className="flex items-center justify-center gap-2.5 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
          <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.88 2.68-6.62z" />
          <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
          <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.05l3.01-2.33z" />
          <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95L3.97 7.28C4.68 5.16 6.66 3.58 9 3.58z" />
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or with email
        <span className="h-px flex-1 bg-border" />
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
