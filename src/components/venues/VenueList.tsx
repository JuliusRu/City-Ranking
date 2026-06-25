"use client";

import { useState } from "react";
import Link from "next/link";
import { useVenues } from "@/hooks/useVenues";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ratingToColor, ratingToDisplay } from "@/lib/rating";
import { VENUE_TYPES, BUDGET_LEVELS } from "@/config/constants";
import type { VenueData } from "@/types";

const TYPE_LABEL = Object.fromEntries(VENUE_TYPES.map((t) => [t.value, t.label]));
const PRICE_LABEL = Object.fromEntries(BUDGET_LEVELS.map((b) => [b.value, b.label]));

export function VenueList() {
  const [typeFilter, setTypeFilter] = useState<string>("");
  const { venues, isLoading, error, mutate } = useVenues({
    type: typeFilter || undefined,
    sortBy: "rating",
    sortOrder: "desc",
  });
  const { toast } = useToast();
  const [deleteTarget, setDeleteTarget] = useState<VenueData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/venues/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast(`${deleteTarget.name} deleted`, "success");
        mutate();
      } else {
        toast(data.error || "Could not delete", "error");
      }
    } catch {
      toast("Could not delete. Check your connection.", "error");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-8 text-center">
        <p className="text-sm text-destructive">Could not load places. Please refresh.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Type filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        <FilterChip label="All" active={typeFilter === ""} onClick={() => setTypeFilter("")} />
        {VENUE_TYPES.map((t) => (
          <FilterChip
            key={t.value}
            label={t.label}
            active={typeFilter === t.value}
            onClick={() => setTypeFilter(t.value)}
          />
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      ) : venues.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-lg font-medium text-foreground">
            {typeFilter ? "Nothing here yet" : "No places yet"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add the restaurants, cafés and bars you want to remember.
          </p>
          <Link href="/places/new" className="mt-4 inline-block">
            <Button>Add Place</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {venues.map((v) => (
            <div key={v.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                {v.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={v.photoUrl}
                    alt={v.name}
                    className="h-12 w-12 flex-shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div
                    className="flex h-10 w-12 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold"
                    style={{
                      backgroundColor: `${ratingToColor(v.rating)}20`,
                      color: ratingToColor(v.rating),
                    }}
                  >
                    {ratingToDisplay(v.rating)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{v.name}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                    <span>{TYPE_LABEL[v.type] ?? v.type}</span>
                    {v.location && (
                      <>
                        <span className="text-border">·</span>
                        <span className="truncate">{v.location}</span>
                      </>
                    )}
                    {v.priceLevel && (
                      <>
                        <span className="text-border">·</span>
                        <span>{PRICE_LABEL[v.priceLevel] ?? v.priceLevel}</span>
                      </>
                    )}
                    {v.wouldReturn && (
                      <span className="rounded-full bg-leaf/15 px-2 py-0.5 font-medium text-leaf">
                        Would return
                      </span>
                    )}
                  </div>
                  {v.note && (
                    <p className="mt-2 text-sm leading-relaxed text-card-foreground">{v.note}</p>
                  )}
                </div>
                <div className="flex flex-shrink-0 items-center gap-1">
                  <Link
                    href={`/places/${v.id}`}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                    aria-label={`Edit ${v.name}`}
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
                  <button
                    onClick={() => setDeleteTarget(v)}
                    aria-label={`Delete ${v.name}`}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-destructive"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M2 4h12M5.333 4V2.667A1.333 1.333 0 0 1 6.667 1.333h2.666A1.333 1.333 0 0 1 10.667 2.667V4m2 0v9.333A1.333 1.333 0 0 1 11.333 14.667H4.667A1.333 1.333 0 0 1 3.333 13.333V4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete place?">
        <p className="mb-6 text-sm text-muted-foreground">
          Delete <span className="font-medium text-foreground">{deleteTarget?.name}</span>? This
          can&apos;t be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" size="sm" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" disabled={isDeleting} onClick={handleDelete}>
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-gradient-brand text-white"
          : "border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
