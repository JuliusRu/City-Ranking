/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  serverExternalPackages: ["@prisma/client"],
  // Dev only: allow the Next dev server's internal requests (HMR/RSC) when the
  // page is opened from another origin than localhost — e.g. the Mac's Tailscale
  // MagicDNS host (*.ts.net) on the phone. No effect on production builds.
  allowedDevOrigins: ["*.ts.net", "*.trycloudflare.com"],
  // Server Actions (used by login/signup/logout) are rejected when the request
  // Origin doesn't match the host. Behind the Coolify/Cloudflare proxy the
  // forwarded host can differ, so trust our real domains explicitly. The
  // *.ts.net entry lets login work when reaching the dev server over Tailscale.
  experimental: {
    serverActions: {
      allowedOrigins: ["ranking.place", "www.ranking.place", "*.ts.net", "*.trycloudflare.com"],
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
