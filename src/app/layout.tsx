import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "City Ranking",
  description: "Rate and explore cities you've visited on an interactive 3D globe",
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
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        <ToastProvider>
          <Header />
          <main className="h-[calc(100vh-64px)]">{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
