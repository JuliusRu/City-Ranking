"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// OAuth + recovery callback. We do the code exchange in the BROWSER client so
// the session cookies are written the same way email/password login writes them
// (the server-route variant set the cookies on a redirect response, which the
// browser dropped — silently logging the user back out).
export default function AuthCallbackPage() {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const run = async () => {
      const supabase = createClient();
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const next = params.get("next") || "/";

      if (!code) {
        window.location.assign("/login?error=auth");
        return;
      }

      // exchangeCodeForSession may report an error if detectSessionInUrl already
      // consumed the code — so afterwards we just check whether a session exists.
      await supabase.auth.exchangeCodeForSession(code).catch(() => {});
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        window.location.assign(next);
      } else {
        setFailed(true);
        setTimeout(() => window.location.assign("/login?error=auth"), 1500);
      }
    };
    run();
  }, []);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p className="text-sm text-muted-foreground">
        {failed ? "Sign-in failed — sending you back…" : "Signing you in…"}
      </p>
    </div>
  );
}
