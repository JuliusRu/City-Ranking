import { ImageResponse } from "next/og";

// Colocating this file at the app root auto-wires <meta property="og:image"> for
// the landing page (and, via the twitter card, X/LinkedIn previews). Crawlers
// fetch it server-side, so CSP doesn't apply — we render it with ImageResponse
// (Satori), not a Cesium screenshot (WebGL can't run server-side). This mirrors
// the per-profile card in [handle]/opengraph-image.tsx.

export const alt = "ranking.place — Your world, ranked";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
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
        <div style={{ display: "flex", fontSize: 32, color: "#5B9BB5", fontWeight: 700 }}>
          ranking.place
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 84, fontWeight: 800, lineHeight: 1.05 }}>
            Your world, ranked.
          </div>
          <div style={{ display: "flex", fontSize: 36, color: "#A89A87", marginTop: 20, maxWidth: 900 }}>
            Rate and explore every city you&apos;ve visited on an interactive 3D globe.
          </div>
        </div>

        <div style={{ display: "flex", gap: "56px", fontSize: 36, color: "#A89A87" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
            <span style={{ fontWeight: 800, color: "#5B9BB5" }}>Cities</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
            <span style={{ fontWeight: 800, color: "#C08552" }}>Countries</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
            <span style={{ fontWeight: 800, color: "#7FA670" }}>Continents</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
