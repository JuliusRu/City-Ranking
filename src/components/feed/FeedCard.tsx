"use client";

import Link from "next/link";
import { ratingToColor, ratingToDisplay } from "@/lib/rating";
import { timeAgo } from "@/lib/timeago";
import { LikeButton } from "./LikeButton";
import { FollowButton } from "./FollowButton";
import type { FeedItem } from "@/types";

export function FeedCard({ item }: { item: FeedItem }) {
  const displayName = item.author.name ?? `@${item.author.username}`;
  const initial = (item.author.name ?? item.author.username)
    .charAt(0)
    .toUpperCase();

  return (
    <article className="rounded-xl border border-border bg-card p-4">
      {/* Header: author + when + follow */}
      <div className="flex items-center gap-3">
        <Link
          href={`/@${item.author.username}`}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground transition-opacity hover:opacity-80"
        >
          {initial}
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={`/@${item.author.username}`}
            className="truncate font-medium text-foreground hover:underline"
          >
            {displayName}
          </Link>
          <p className="truncate text-xs text-muted-foreground">
            @{item.author.username} · {timeAgo(item.createdAt)}
          </p>
        </div>
        {!item.isOwn && (
          <FollowButton
            username={item.author.username}
            initialFollowing={item.followedByViewer}
            size="sm"
          />
        )}
      </div>

      {/* Body: the rating */}
      <div className="mt-3 flex items-start gap-3">
        <div
          className="flex h-11 w-12 flex-shrink-0 items-center justify-center rounded-lg text-base font-bold"
          style={{
            backgroundColor: `${ratingToColor(item.rating)}20`,
            color: ratingToColor(item.rating),
          }}
        >
          {ratingToDisplay(item.rating)}
        </div>
        <div className="min-w-0 flex-1">
          <Link
            href={`/cities/${item.city.id}`}
            className="font-semibold text-foreground hover:underline"
          >
            {item.city.name}
          </Link>
          <span className="text-sm text-muted-foreground"> · {item.city.country}</span>

          {item.districts.length > 0 && (
            <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              <span aria-hidden>📍</span>
              {item.districts.join(" · ")}
            </p>
          )}

          {item.comment && (
            <p className="mt-2 text-sm leading-relaxed text-card-foreground">
              {item.comment}
            </p>
          )}
        </div>
      </div>

      {/* Footer: like */}
      <div className="mt-3 flex items-center gap-1 border-t border-border pt-2">
        <LikeButton
          visitId={item.id}
          initialLiked={item.likedByViewer}
          initialCount={item.likeCount}
        />
      </div>
    </article>
  );
}
