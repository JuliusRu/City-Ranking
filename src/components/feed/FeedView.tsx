"use client";

import { useState } from "react";
import Link from "next/link";
import { useFeed } from "@/hooks/useFeed";
import { FeedCard } from "./FeedCard";
import { Button } from "@/components/ui/Button";
import type { FeedScope } from "@/types";

const TABS: { value: FeedScope; label: string }[] = [
  { value: "global", label: "Discover" },
  { value: "following", label: "Following" },
];

export function FeedView() {
  const [scope, setScope] = useState<FeedScope>("global");
  const { items, error, isLoading, isLoadingMore, hasMore, loadMore } =
    useFeed(scope);

  return (
    <div>
      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-lg border border-border bg-card p-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setScope(t.value)}
            aria-current={scope === t.value ? "page" : undefined}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              scope === t.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-8 text-center">
          <p className="text-sm text-destructive">
            Could not load the feed. Please refresh.
          </p>
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-xl border border-border bg-card"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState scope={scope} onGoDiscover={() => setScope("global")} />
      ) : (
        <>
          <div className="space-y-3">
            {items.map((item) => (
              <FeedCard key={item.id} item={item} />
            ))}
          </div>
          {hasMore && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="secondary"
                onClick={loadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? "Loading…" : "Load more"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EmptyState({
  scope,
  onGoDiscover,
}: {
  scope: FeedScope;
  onGoDiscover: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-12 text-center">
      {scope === "following" ? (
        <>
          <p className="text-lg font-medium text-foreground">
            Your following feed is empty
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Follow other travellers to see their city ratings here.
          </p>
          <p className="mt-4 text-sm">
            <span className="text-muted-foreground">Find people in </span>
            <button
              onClick={onGoDiscover}
              className="font-medium text-primary hover:underline"
            >
              Discover
            </button>
          </p>
        </>
      ) : (
        <>
          <p className="text-lg font-medium text-foreground">No ratings yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Public city ratings from the community will show up here.
          </p>
          <Link href="/visits/new" className="mt-4 inline-block">
            <Button>Share a rating</Button>
          </Link>
        </>
      )}
    </div>
  );
}
