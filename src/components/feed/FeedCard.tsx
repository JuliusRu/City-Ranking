"use client";

import { useState } from "react";
import Link from "next/link";
import { ratingToColor, ratingToDisplay, ratingTextColor } from "@/lib/rating";
import { timeAgo } from "@/lib/timeago";
import { LikeButton } from "./LikeButton";
import { FollowButton } from "./FollowButton";
import { CommentSection } from "./CommentSection";
import { Avatar } from "@/components/ui/Avatar";
import type { FeedItem } from "@/types";

export function FeedCard({ item }: { item: FeedItem }) {
  const displayName = item.author.name ?? `@${item.author.username}`;

  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(item.commentCount);

  return (
    <article className="rounded-xl border border-border bg-card p-4">
      {/* Header: author + when + follow */}
      <div className="flex items-center gap-3">
        <Link
          href={`/@${item.author.username}`}
          className="flex-shrink-0 transition-opacity hover:opacity-80"
        >
          <Avatar src={item.author.avatarUrl} name={displayName} size={40} />
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
            backgroundColor: ratingToColor(item.rating),
            color: ratingTextColor(item.rating),
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

      {item.photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.photoUrl}
          alt={`${item.city.name} photo`}
          className="mt-3 max-h-96 w-full rounded-xl object-cover"
        />
      )}

      {/* Footer: like + comment toggle */}
      <div className="mt-3 flex items-center gap-1 border-t border-border pt-2">
        <LikeButton
          visitId={item.id}
          initialLiked={item.likedByViewer}
          initialCount={item.likeCount}
        />
        <button
          onClick={() => setShowComments((s) => !s)}
          aria-expanded={showComments}
          className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm transition-colors ${
            showComments
              ? "text-primary"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          <span className="tabular-nums">{commentCount}</span>
        </button>
      </div>

      {showComments && (
        <CommentSection
          visitId={item.id}
          onCountChange={(delta) => setCommentCount((c) => Math.max(0, c + delta))}
        />
      )}
    </article>
  );
}
