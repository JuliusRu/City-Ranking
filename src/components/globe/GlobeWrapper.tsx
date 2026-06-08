"use client";

import { useMemo } from "react";
import { GlobeStage } from "./GlobeStage";
import { useVisits } from "@/hooks/useVisits";
import type { GlobeMarker } from "@/types";

export function GlobeWrapper() {
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

  return <GlobeStage markers={markers} />;
}
