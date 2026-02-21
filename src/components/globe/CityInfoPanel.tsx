"use client";

import Link from "next/link";
import { ratingToColor, ratingToDisplay } from "@/lib/rating";
import type { GlobeMarker } from "@/types";

interface CityInfoPanelProps {
  marker: GlobeMarker;
  onClose: () => void;
  onFlyTo?: () => void;
}

export function CityInfoPanel({ marker, onClose, onFlyTo }: CityInfoPanelProps) {
  return (
    <div
      role="dialog"
      aria-label={`${marker.cityName} info`}
      className="absolute right-2 top-2 z-10 w-[calc(100vw-1rem)] max-w-xs rounded-xl border border-border bg-card/95 p-4 shadow-2xl backdrop-blur-sm sm:right-4 sm:top-4 sm:w-80 sm:p-5"
    >
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {marker.cityName}
          </h3>
          <p className="text-sm text-muted-foreground">{marker.country}</p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close panel"
          className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M15 5L5 15M5 5l10 10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <div className="mb-3 flex items-center gap-3">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-lg text-lg font-bold"
          style={{
            backgroundColor: `${ratingToColor(marker.rating)}20`,
            color: ratingToColor(marker.rating),
          }}
        >
          {ratingToDisplay(marker.rating)}
        </div>
        <div className="text-sm text-muted-foreground">
          <p>
            Visited{" "}
            {new Date(marker.startDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
            {marker.endDate && (
              <>
                {" - "}
                {new Date(marker.endDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </>
            )}
          </p>
        </div>
      </div>

      {marker.comment && (
        <p className="mb-4 text-sm leading-relaxed text-card-foreground">
          {marker.comment}
        </p>
      )}

      <div className="flex gap-2">
        {onFlyTo && (
          <button
            onClick={onFlyTo}
            className="flex-1 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
          >
            Fly to
          </button>
        )}
        <Link
          href={`/visits/${marker.id}`}
          className="flex-1 rounded-lg bg-accent px-3 py-2 text-center text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Edit
        </Link>
      </div>
    </div>
  );
}
