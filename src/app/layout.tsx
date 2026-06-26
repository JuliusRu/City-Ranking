import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter, Geist_Mono } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// metadataBase makes the colocated opengraph-image resolve to an absolute URL,
// which crawlers (Twitter/X, LinkedIn, WhatsApp, iMessage) require. Falls back to
// the prod domain so previews work even if the env var isn't set in Coolify.
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://www.ranking.place"
  ),
  title: {
    default: "ranking.place — Your world, ranked",
    template: "%s",
  },
  description:
    "Rate and explore the cities you've visited on an interactive 3D globe. Build your travel map, track countries and continents, and share your profile.",
  applicationName: "ranking.place",
  openGraph: {
    type: "website",
    siteName: "ranking.place",
    title: "ranking.place — Your world, ranked",
    description:
      "Rate and explore the cities you've visited on an interactive 3D globe. Build your travel map and share your profile.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "ranking.place — Your world, ranked",
    description:
      "Rate and explore the cities you've visited on an interactive 3D globe.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Reading a per-request header opts every route into dynamic rendering, so
  // Next.js stamps the middleware's nonce onto its inline scripts at request
  // time. Without this the pages prerender statically with no nonce and the CSP
  // blocks them.
  await headers();

  return (
    // suppressHydrationWarning: browser extensions (e.g. Scribe recorder) and
    // theme scripts mutate <html> attributes before React hydrates, which would
    // otherwise trigger a hydration-mismatch warning. This suppresses it for
    // this element only — one level deep, not the whole tree.
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        <ToastProvider>
          <Header />
          <main className="h-[calc(100vh-64px)]">{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
