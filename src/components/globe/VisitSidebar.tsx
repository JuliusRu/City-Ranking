"use client";

import { useState } from "react";
import Link from "next/link";
import { ratingToColor, ratingToDisplay } from "@/lib/rating";
import type { GlobeMarker } from "@/types";

interface VisitSidebarProps {
  markers: GlobeMarker[];
  onFlyTo: (marker: GlobeMarker) => void;
  readOnly?: boolean;
}

export function VisitSidebar({ markers, onFlyTo, readOnly = false }: VisitSidebarProps) {
  // Open by default so the ranking reads as a designed, floating panel rather
  // than a hidden drawer pinned to the screen edge.
  const [isOpen, setIsOpen] = useState(true);

  if (markers.length === 0) {
    return (
      <div className="absolute left-4 top-4 z-10 max-w-xs rounded-2xl border border-border bg-card/95 p-5 shadow-xl backdrop-blur-md">
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
          {readOnly ? "No public cities yet" : "No cities visited yet"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {readOnly
            ? "This traveler hasn't shared any cities publicly."
            : "Add your first visit to see it on the globe."}
        </p>
        {!readOnly && (
          <Link
            href="/visits/new"
            className="mt-3 inline-block rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            Add Visit
          </Link>
        )}
      </div>
    );
  }

  const sorted = [...markers].sort((a, b) => b.rating - a.rating);

  // Collapsed: a small floating pill that reopens the panel — keeps the globe
  // clear without the panel ever touching the viewport edge.
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Show visited cities"
        className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full border border-border bg-card/95 px-4 py-2 text-sm font-medium text-foreground shadow-lg backdrop-blur-md transition-colors hover:bg-accent"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
        Cities
        <span className="text-muted-foreground">{markers.length}</span>
      </button>
    );
  }

  return (
    <div className="absolute left-4 top-4 z-10 flex max-h-[calc(100%-2rem)] w-64 flex-col overflow-hidden rounded-2xl border border-border bg-card/95 shadow-xl backdrop-blur-md sm:w-72">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Visited Cities{" "}
          <span className="text-foreground/70">({markers.length})</span>
        </h2>
        <button
          onClick={() => setIsOpen(false)}
          aria-label="Collapse"
          className="-mr-1 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
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
      <div className="overflow-y-auto p-2">
        <div className="space-y-0.5">
          {sorted.map((marker) => (
            <button
              key={marker.id}
              onClick={() => onFlyTo(marker)}
              aria-label={`Fly to ${marker.cityName}, rated ${ratingToDisplay(marker.rating)}`}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent"
            >
              <div
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-xs font-bold"
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
  );
}
