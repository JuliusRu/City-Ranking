"use client";

import { useState } from "react";
import { useVisits } from "@/hooks/useVisits";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { VisitCard } from "./VisitCard";
import { Button } from "@/components/ui/Button";

export function VisitList() {
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const { visits, pagination, isLoading, error, mutate } = useVisits({
    page,
    sortBy,
    sortOrder,
  });
  const { toast } = useToast();
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    cityName: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/visits/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast(`${deleteTarget.cityName} visit deleted`, "success");
        mutate();
      } else {
        toast(data.error || "Could not delete visit", "error");
      }
    } catch {
      toast("Could not delete visit. Check your connection.", "error");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-8 text-center">
        <p className="text-sm text-destructive">
          Could not load visits. Please try refreshing.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-xl border border-border bg-card"
          />
        ))}
      </div>
    );
  }

  if (visits.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-primary"
            />
            <circle
              cx="12"
              cy="9"
              r="2.5"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-primary"
            />
          </svg>
        </div>
        <p className="text-lg font-medium text-foreground">No visits yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Start by adding your first city visit!
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          aria-label="Sort by"
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
        >
          <option value="createdAt">Date Added</option>
          <option value="startDate">Trip Date</option>
          <option value="rating">Rating</option>
        </select>
        <button
          onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
          aria-label={`Sort ${sortOrder === "desc" ? "ascending" : "descending"}`}
          className="flex h-9 items-center gap-1 rounded-lg border border-border bg-background px-3 text-sm text-foreground hover:bg-accent"
        >
          {sortOrder === "desc" ? "Newest first" : "Oldest first"}
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            className={`transition-transform ${sortOrder === "asc" ? "rotate-180" : ""}`}
          >
            <path
              d="M7 3v8m0 0l3-3m-3 3L4 8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className="space-y-3">
        {visits.map((visit) => (
          <VisitCard
            key={visit.id}
            visit={visit}
            onDelete={(id) =>
              setDeleteTarget({ id, cityName: visit.city.name })
            }
          />
        ))}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {pagination.totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete visit?"
      >
        <p className="mb-6 text-sm text-muted-foreground">
          Are you sure you want to delete your visit to{" "}
          <span className="font-medium text-foreground">
            {deleteTarget?.cityName}
          </span>
          ? This can&apos;t be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setDeleteTarget(null)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={isDeleting}
            onClick={handleDelete}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
