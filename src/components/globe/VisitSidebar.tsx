"use client";

import { useState } from "react";
import Link from "next/link";
import { ratingToColor, ratingToDisplay } from "@/lib/rating";
import type { GlobeMarker } from "@/types";

interface VisitSidebarProps {
  markers: GlobeMarker[];
  onFlyTo: (marker: GlobeMarker) => void;
}

export function VisitSidebar({ markers, onFlyTo }: VisitSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (markers.length === 0) {
    return (
      <div className="absolute left-4 top-4 z-10 max-w-xs rounded-xl border border-border bg-card/95 p-5 backdrop-blur-sm">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-primary"
            />
            <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" className="text-primary" />
          </svg>
        </div>
        <p className="text-sm font-medium text-foreground">
          No cities visited yet
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Add your first visit to see it on the globe.
        </p>
        <Link
          href="/visits/new"
          className="mt-3 inline-block rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          Add Visit
        </Link>
      </div>
    );
  }

  const sorted = [...markers].sort((a, b) => b.rating - a.rating);

  return (
    <div className="absolute left-0 top-0 z-10 flex h-full">
      <div
        className={`h-full w-64 overflow-y-auto border-r border-border bg-card/95 backdrop-blur-sm transition-[margin] duration-300 sm:w-72 ${
          isOpen ? "ml-0" : "-ml-64 sm:-ml-72"
        }`}
      >
        <div className="p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Visited Cities ({markers.length})
          </h2>
          <div className="space-y-1">
            {sorted.map((marker) => (
              <button
                key={marker.id}
                onClick={() => onFlyTo(marker)}
                aria-label={`Fly to ${marker.cityName}, rated ${ratingToDisplay(marker.rating)}`}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent"
              >
                <div
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded text-xs font-bold"
                  style={{
                    backgroundColor: `${ratingToColor(marker.rating)}20`,
                    color: ratingToColor(marker.rating),
                  }}
                >
                  {ratingToDisplay(marker.rating)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {marker.cityName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {marker.country}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
        className="mt-4 flex h-10 w-8 flex-shrink-0 items-center justify-center rounded-r-lg border border-l-0 border-border bg-card/95 text-muted-foreground backdrop-blur-sm hover:text-foreground"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className={`transition-transform ${isOpen ? "rotate-0" : "rotate-180"}`}
        >
          <path
            d="M10 4L6 8l4 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
