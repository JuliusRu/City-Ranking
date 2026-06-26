import { ImageResponse } from "next/og";
import { getPublicProfile } from "@/lib/profile";

// Colocating this file makes Next auto-wire <meta property="og:image"> for the
// /@handle route. Crawlers (WhatsApp, iMessage, Twitter) fetch it server-side,
// so CSP doesn't apply and we render the card with ImageResponse (Satori), not
// a Cesium screenshot (WebGL can't run server-side).

export const alt = "Travel profile on ranking.place";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function parseHandle(raw: string): string | null {
  const decoded = decodeURIComponent(raw);
  if (!decoded.startsWith("@")) return null;
  return decoded.slice(1).toLowerCase();
}

export default async function Image({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const username = parseHandle(handle);
  const profile = username ? await getPublicProfile(username) : null;

  const displayName = profile?.name ?? (username ? `@${username}` : "ranking.place");
  const cities = profile?.stats.cities ?? 0;
  const countries = profile?.stats.countries ?? 0;
  // Pro accent (already gated to Pro users in getPublicProfile) tints the shared
  // card; non-Pro / missing falls back to the default brand blue.
  const accent = profile?.accentColor ?? "#5B9BB5";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #1C1814 0%, #2A241D 100%)",
          padding: "80px",
          color: "#EDE6DA",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 32, color: accent, fontWeight: 700 }}>
          ranking.place
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 800, lineHeight: 1.1 }}>
            {displayName}
          </div>
          {profile && (
            <div style={{ display: "flex", fontSize: 36, color: "#A89A87", marginTop: 12 }}>
              @{profile.username}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "56px", fontSize: 40 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
            <span style={{ fontWeight: 800, color: accent }}>{cities}</span>
            <span style={{ color: "#A89A87" }}>cities</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
            <span style={{ fontWeight: 800, color: "#C08552" }}>{countries}</span>
            <span style={{ color: "#A89A87" }}>countries</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
