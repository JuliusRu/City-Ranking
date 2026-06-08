"use client";

import dynamic from "next/dynamic";
import type { GlobeMarker } from "@/types";

// Cesium can't server-render (WebGL + WASM), so the stage is loaded client-only —
// same ssr:false boundary the authed app uses via GlobeClient.
const GlobeStage = dynamic(
  () => import("@/components/globe/GlobeStage").then((m) => m.GlobeStage),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading globe...</p>
        </div>
      </div>
    ),
  }
);

export function PublicGlobe({ markers }: { markers: GlobeMarker[] }) {
  return <GlobeStage markers={markers} readOnly />;
}
