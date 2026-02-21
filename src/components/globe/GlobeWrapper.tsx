"use client";

import { useState, useMemo, useCallback } from "react";
import { GlobeViewer } from "./GlobeViewer";
import { CityInfoPanel } from "./CityInfoPanel";
import { VisitSidebar } from "./VisitSidebar";
import { useVisits } from "@/hooks/useVisits";
import { useGlobeTour } from "@/hooks/useGlobe";
import type { GlobeMarker } from "@/types";

export function GlobeWrapper() {
  const [selectedMarker, setSelectedMarker] = useState<GlobeMarker | null>(
    null
  );
  const [flyToTarget, setFlyToTarget] = useState<{
    longitude: number;
    latitude: number;
  } | null>(null);
  const { visits } = useVisits({ limit: 100 });

  const markers: GlobeMarker[] = useMemo(
    () =>
      visits.map((v) => ({
        id: v.id,
        cityId: v.city.id,
        cityName: v.city.name,
        country: v.city.country,
        latitude: v.city.latitude,
        longitude: v.city.longitude,
        rating: v.rating,
        startDate: v.startDate,
        endDate: v.endDate,
        comment: v.comment,
      })),
    [visits]
  );

  const handleFlyTo = useCallback((marker: GlobeMarker) => {
    setFlyToTarget({ longitude: marker.longitude, latitude: marker.latitude });
    setSelectedMarker(marker);
    setTimeout(() => setFlyToTarget(null), 100);
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
      <VisitSidebar markers={markers} onFlyTo={handleFlyTo} />

      {/* Tour control */}
      {markers.length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
          {isTouring ? (
            <button
              onClick={stopTour}
              className="rounded-full border border-border bg-card/95 px-6 py-2 text-sm font-medium text-foreground shadow-lg backdrop-blur-sm hover:bg-accent"
            >
              Stop Tour
            </button>
          ) : (
            <button
              onClick={handleStartTour}
              className="rounded-full border border-border bg-card/95 px-6 py-2 text-sm font-medium text-foreground shadow-lg backdrop-blur-sm hover:bg-accent"
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
          onFlyTo={() =>
            setFlyToTarget({
              longitude: selectedMarker.longitude,
              latitude: selectedMarker.latitude,
            })
          }
        />
      )}
    </div>
  );
}
