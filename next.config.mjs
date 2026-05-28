/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  serverExternalPackages: ["@prisma/client"],
  // Server Actions (used by login/signup/logout) are rejected when the request
  // Origin doesn't match the host. Behind the Coolify/Cloudflare proxy the
  // forwarded host can differ, so trust our real domains explicitly.
  experimental: {
    serverActions: {
      allowedOrigins: ["ranking.place", "www.ranking.place"],
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
