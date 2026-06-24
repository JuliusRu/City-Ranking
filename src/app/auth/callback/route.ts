import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// OAuth + recovery callback: providers (Google) and the password-reset email
// link both redirect here with a `code`. We exchange it for a session (cookies
// set on the response), then continue to `next` (defaults to home; the reset
// link sends ?next=/auth/reset).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("auth/callback: exchange failed:", error.message);
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
