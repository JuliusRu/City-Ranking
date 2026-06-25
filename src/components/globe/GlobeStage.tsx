"use client";

import { useState, useCallback, useRef } from "react";
import { GlobeViewer } from "./GlobeViewer";
import { CityInfoPanel } from "./CityInfoPanel";
import { VisitSidebar } from "./VisitSidebar";
import { useGlobeTour } from "@/hooks/useGlobe";
import type { GlobeMarker } from "@/types";

interface GlobeStageProps {
  markers: GlobeMarker[];
  // readOnly hides owner-only affordances (Edit links, "Add Visit") so the same
  // globe can render a visitor's public view of someone else's profile.
  readOnly?: boolean;
}

// Presentational globe: takes ready-made markers and renders the viewer, sidebar,
// tour control, and info panel. No data fetching — the authed app (GlobeWrapper)
// and public profiles (/@username) both feed it markers from different sources.
export function GlobeStage({ markers, readOnly = false }: GlobeStageProps) {
  const [selectedMarker, setSelectedMarker] = useState<GlobeMarker | null>(null);
  const [flyToTarget, setFlyToTarget] = useState<{
    longitude: number;
    latitude: number;
    key: number;
  } | null>(null);
  const flyKeyRef = useRef(0);

  const handleFlyTo = useCallback((marker: GlobeMarker) => {
    flyKeyRef.current += 1;
    setFlyToTarget({
      longitude: marker.longitude,
      latitude: marker.latitude,
      key: flyKeyRef.current,
    });
    setSelectedMarker(marker);
  }, []);

  const { isTouring, startTour, stopTour } = useGlobeTour(markers);

  function handleStartTour() {
    startTour(handleFlyTo);
  }

  return (
    <div className="relative h-full w-full">
      <GlobeViewer
        markers={markers}
        onMarkerClick={setSelectedMarker}
        flyToTarget={flyToTarget}
      />
      <VisitSidebar markers={markers} onFlyTo={handleFlyTo} readOnly={readOnly} />

      {/* Tour control */}
      {markers.length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
          {isTouring ? (
            <button
              onClick={stopTour}
              className="rounded-full border border-border glass px-6 py-2 text-sm font-medium text-foreground shadow-lg hover:bg-accent"
            >
              Stop Tour
            </button>
          ) : (
            <button
              onClick={handleStartTour}
              className="rounded-full border border-border glass px-6 py-2 text-sm font-medium text-foreground shadow-lg hover:bg-accent"
            >
              Tour Cities
            </button>
          )}
        </div>
      )}

      {selectedMarker && !isTouring && (
        <CityInfoPanel
          marker={selectedMarker}
          onClose={() => setSelectedMarker(null)}
          onFlyTo={() => handleFlyTo(selectedMarker)}
          readOnly={readOnly}
        />
      )}
    </div>
  );
}
