import { useState, useCallback, useRef } from "react";
import type { GlobeMarker } from "@/types";
import { GLOBE } from "@/config/constants";

export function useGlobeTour(markers: GlobeMarker[]) {
  const [isTouring, setIsTouring] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startTour = useCallback(
    (onFlyTo: (marker: GlobeMarker) => void) => {
      if (markers.length === 0) return;

      setIsTouring(true);
      setCurrentIndex(0);

      const sorted = [...markers].sort((a, b) => b.rating - a.rating);

      function flyToNext(index: number) {
        if (index >= sorted.length) {
          setIsTouring(false);
          return;
        }

        setCurrentIndex(index);
        onFlyTo(sorted[index]);

        timeoutRef.current = setTimeout(() => {
          flyToNext(index + 1);
        }, (GLOBE.FLY_TO_DURATION + 2) * 1000);
      }

      flyToNext(0);
    },
    [markers]
  );

  const stopTour = useCallback(() => {
    setIsTouring(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return { isTouring, currentIndex, startTour, stopTour };
}
