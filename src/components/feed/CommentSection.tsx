"use client";

import { useState } from "react";
import Link from "next/link";
import { useComments } from "@/hooks/useComments";
import { useToast } from "@/components/ui/Toast";
import { Avatar } from "@/components/ui/Avatar";
import { timeAgo } from "@/lib/timeago";

// Lazy comment thread under a feed card. Mounted only when the user opens it, so
// the list loads on demand. `onCountChange` keeps the card's count badge in sync.
export function CommentSection({
  visitId,
  onCountChange,
}: {
  visitId: string;
  onCountChange: (delta: number) => void;
}) {
  const { comments, isLoading, error, mutate } = useComments(visitId, true);
  const { toast } = useToast();
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/visits/${visitId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const data = await res.json();
      if (data.success) {
        setBody("");
        onCountChange(1);
        mutate();
      } else if (res.status === 401) {
        toast("Sign in to comment", "info");
      } else {
        toast(data.error || "Could not post comment", "error");
      }
    } catch {
      toast("Could not post comment. Check your connection.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id: string) {
    try {
      const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        onCountChange(-1);
        mutate();
      } else {
        toast(data.error || "Could not delete", "error");
      }
    } catch {
      toast("Could not delete. Check your connection.", "error");
    }
  }

  return (
    <div className="mt-3 border-t border-border pt-3">
      <form onSubmit={submit} className="flex gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={500}
          placeholder="Add a comment…"
          className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          disabled={!body.trim() || submitting}
          className="flex-shrink-0 rounded-lg bg-gradient-brand px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "…" : "Post"}
        </button>
      </form>

      {error ? (
        <p className="mt-3 text-sm text-destructive">Could not load comments.</p>
      ) : isLoading ? (
        <p className="mt-3 text-sm text-muted-foreground">Loading…</p>
      ) : comments.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          No comments yet — be the first.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {comments.map((c) => {
            const display = c.author.name ?? `@${c.author.username}`;
            return (
              <li key={c.id} className="flex gap-2.5">
                <Link href={`/@${c.author.username}`} className="flex-shrink-0">
                  <Avatar
                    src={c.author.avatarUrl}
                    name={display}
                    size={32}
                    className="text-xs"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <Link
                      href={`/@${c.author.username}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {display}
                    </Link>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {timeAgo(c.createdAt)}
                    </span>
                  </p>
                  <p className="text-sm leading-relaxed text-card-foreground">
                    {c.body}
                  </p>
                </div>
                {c.isOwn && (
                  <button
                    onClick={() => remove(c.id)}
                    aria-label="Delete comment"
                    className="flex-shrink-0 self-start rounded p-1 text-muted-foreground hover:text-destructive"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M2 4h12M5.333 4V2.667A1.333 1.333 0 0 1 6.667 1.333h2.666A1.333 1.333 0 0 1 10.667 2.667V4m2 0v9.333A1.333 1.333 0 0 1 11.333 14.667H4.667A1.333 1.333 0 0 1 3.333 13.333V4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
