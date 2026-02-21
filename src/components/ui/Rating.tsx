"use client";

import { ratingToColor, ratingToDisplay } from "@/lib/rating";

interface RatingProps {
  value: number; // 0-100
  onChange: (value: number) => void;
  label?: string;
  error?: string;
}

export function Rating({ value, onChange, label, error }: RatingProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor="rating-slider" className="block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="flex items-center gap-4">
        <input
          id="rating-slider"
          type="range"
          min={0}
          max={100}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={`Rating: ${ratingToDisplay(value)} out of 10`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
          className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-muted"
          style={{
            accentColor: ratingToColor(value),
          }}
        />
        <div
          className="flex h-10 w-14 items-center justify-center rounded-lg text-sm font-bold"
          style={{
            backgroundColor: `${ratingToColor(value)}20`,
            color: ratingToColor(value),
          }}
        >
          {ratingToDisplay(value)}
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
