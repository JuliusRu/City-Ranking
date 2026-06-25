"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearch } from "@/hooks/useSearch";
import { Avatar } from "@/components/ui/Avatar";
import { ratingToColor, ratingToDisplay } from "@/lib/rating";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const { results, isLoading, error } = useSearch(query);

  const trimmed = query.trim();
  const hasResults = results.users.length > 0 || results.cities.length > 0;

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      <h1 className="mb-4 text-3xl font-semibold tracking-tight">Search</h1>

      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </span>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="People or cities…"
          className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
      </div>

      <div className="mt-5">
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : trimmed.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Find people by name or @username, and cities the community has rated.
          </p>
        ) : isLoading && !hasResults ? (
          <p className="text-sm text-muted-foreground">Searching…</p>
        ) : !hasResults ? (
          <p className="text-sm text-muted-foreground">
            No people or cities match “{trimmed}”.
          </p>
        ) : (
          <div className="space-y-6">
            {results.users.length > 0 && (
              <section>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  People
                </h2>
                <div className="space-y-2">
                  {results.users.map((u) => {
                    const display = u.name ?? `@${u.username}`;
                    return (
                      <Link
                        key={u.username}
                        href={`/@${u.username}`}
                        className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-accent"
                      >
                        <Avatar src={u.avatarUrl} name={display} size={40} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {display}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            @{u.username}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {results.cities.length > 0 && (
              <section>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Cities
                </h2>
                <div className="space-y-2">
                  {results.cities.map((c) => (
                    <Link
                      key={c.id}
                      href={`/cities/${c.id}`}
                      className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-accent"
                    >
                      <div
                        className="flex h-10 w-12 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold"
                        style={{
                          backgroundColor: `${ratingToColor(c.avgRating)}20`,
                          color: ratingToColor(c.avgRating),
                        }}
                      >
                        {ratingToDisplay(c.avgRating)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {c.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {c.country}
                        </p>
                      </div>
                      <span className="flex-shrink-0 text-xs text-muted-foreground">
                        {c.raters} {c.raters === 1 ? "rating" : "ratings"}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
