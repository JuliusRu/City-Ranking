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

  // Deduplicate visits by city — use the highest rating and most recent visit info
  const markers: GlobeMarker[] = useMemo(() => {
    const cityMap = new Map<string, GlobeMarker>();
    for (const v of visits) {
      const existing = cityMap.get(v.city.id);
      if (!existing || v.rating > existing.rating) {
        cityMap.set(v.city.id, {
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
        });
      }
    }
    return Array.from(cityMap.values());
  }, [visits]);

  const handleFlyTo = useCallback((marker: GlobeMarker) => {
    setFlyToTarget({ longitude: marker.longitude, latitude: marker.latitude });
    setSelectedMarker(marker);
    setTimeout(() => setFlyToTarget(null), 100);
  }, []);

  const { isTouring, startTour, stopTour } = useGlobeTour(markers);

  function handleStartTour() {
    startTour(handleFlyTo);
  }

  // Debug: log markers to console
  console.log("[GlobeWrapper] markers count:", markers.length, "visits count:", visits.length);

  return (
    <div className="relative h-full w-full">
      {/* Temporary debug overlay */}
      <div className="absolute top-4 right-4 z-50 rounded bg-black/80 px-3 py-2 text-xs text-white">
        Visits: {visits.length} | Markers: {markers.length}
      </div>
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
