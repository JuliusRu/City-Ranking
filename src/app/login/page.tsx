"use client";

import { useActionState } from "react";
import { login, signup } from "./actions";

export default function LoginPage() {
  const [loginState, loginAction, loginPending] = useActionState(login, null);
  const [signupState, signupAction, signupPending] = useActionState(
    signup,
    null
  );
  const error = loginState?.error ?? signupState?.error;
  const pending = loginPending || signupPending;

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 p-6 pt-16">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Welcome to ranking.place</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in or create an account to rank the cities you&apos;ve visited.
        </p>
      </div>

      <form className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Password
          <input
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="current-password"
            className="rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-2">
          <button
            formAction={loginAction}
            disabled={pending}
            className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Sign in
          </button>
          <button
            formAction={signupAction}
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
