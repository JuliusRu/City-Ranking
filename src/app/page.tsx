"use client";

import dynamic from "next/dynamic";

const GlobeWrapper = dynamic(
  () => import("@/components/globe/GlobeWrapper").then((m) => m.GlobeWrapper),
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

export default function HomePage() {
  return <GlobeWrapper />;
}
