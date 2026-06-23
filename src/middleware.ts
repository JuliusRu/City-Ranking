import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { generateCSP } from "@/config/csp";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/env";

export async function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = generateCSP(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  // Next.js reads the nonce from the CSP on the *request* headers and stamps it
  // onto its own inline scripts. Without this, those scripts get no nonce and
  // the response CSP blocks them, breaking hydration.
  requestHeaders.set("Content-Security-Policy", csp);

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  // Refresh the Supabase auth session and persist rotated cookies on the
  // response. Do not insert logic between createServerClient and getUser.
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Gating: send logged-out users away from app routes, and logged-in users
  // away from the login page. APIs handle their own 401, and "/" renders the
  // public landing when logged out, so neither is gated here.
  const path = request.nextUrl.pathname;
  const protectedPrefixes = ["/cities", "/stats", "/visits", "/settings", "/places", "/feed"];
  const isProtected = protectedPrefixes.some(
    (p) => path === p || path.startsWith(p + "/")
  );
  if ((!user && isProtected) || (user && path === "/login")) {
    const url = request.nextUrl.clone();
    url.pathname = user ? "/" : "/login";
    const redirectResponse = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => redirectResponse.cookies.set(c));
    return redirectResponse;
  }

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files and _next internals
    "/((?!_next/static|_next/image|favicon.ico|cesium/).*)",
  ],
};
