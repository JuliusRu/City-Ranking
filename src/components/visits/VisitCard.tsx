"use client";

import Link from "next/link";
import { ratingToColor, ratingToDisplay } from "@/lib/rating";
import type { VisitWithCity } from "@/types";

interface VisitCardProps {
  visit: VisitWithCity;
  onDelete?: (id: string) => void;
}

function formatDateRange(startDate: string, endDate: string | null): string {
  const start = new Date(startDate);
  const opts: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };
  if (!endDate) return start.toLocaleDateString("en-US", opts);

  const end = new Date(endDate);
  const startStr = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endStr = end.toLocaleDateString("en-US", opts);
  return `${startStr} - ${endStr}`;
}

function getDuration(startDate: string, endDate: string | null): string {
  if (!endDate) return "Day trip";
  const diff = Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  if (diff <= 0) return "Day trip";
  return `${diff} day${diff > 1 ? "s" : ""}`;
}

export function VisitCard({ visit, onDelete }: VisitCardProps) {
  const pills = [visit.tripType, visit.budgetLevel, visit.transport].filter(Boolean);

  return (
    <div className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-muted">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg text-lg font-bold"
            style={{
              backgroundColor: `${ratingToColor(visit.rating)}20`,
              color: ratingToColor(visit.rating),
            }}
          >
            {ratingToDisplay(visit.rating)}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              {visit.city.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {[visit.city.state, visit.city.country]
                .filter(Boolean)
                .join(", ")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatDateRange(visit.startDate, visit.endDate)}
              <span className="mx-1.5 text-border">|</span>
              {getDuration(visit.startDate, visit.endDate)}
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          <Link
            href={`/visits/${visit.id}`}
            aria-label={`Edit ${visit.city.name} visit`}
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M11.333 2A1.886 1.886 0 0 1 14 4.667l-9 9-3.667 1 1-3.667 9-9Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          {onDelete && (
            <button
              onClick={() => onDelete(visit.id)}
              aria-label={`Delete ${visit.city.name} visit`}
              className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M2 4h12M5.333 4V2.667a1.333 1.333 0 0 1 1.334-1.334h2.666a1.333 1.333 0 0 1 1.334 1.334V4m2 0v9.333a1.333 1.333 0 0 1-1.334 1.334H4.667a1.333 1.333 0 0 1-1.334-1.334V4h9.334Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
      {pills.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {pills.map((pill) => (
            <span
              key={pill}
              className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground"
            >
              {pill}
            </span>
          ))}
        </div>
      )}
      {visit.comment && (
        <p className="mt-3 text-sm leading-relaxed text-card-foreground line-clamp-3">
          {visit.comment}
        </p>
      )}
    </div>
  );
}
