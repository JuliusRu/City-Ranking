"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";

export function LikeButton({
  visitId,
  initialLiked,
  initialCount,
}: {
  visitId: string;
  initialLiked: boolean;
  initialCount: number;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);
  const { toast } = useToast();

  async function toggle() {
    if (pending) return;
    const next = !liked;

    // Optimistic: flip immediately, roll back if the request fails.
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));
    setPending(true);

    try {
      const res = await fetch(`/api/visits/${visitId}/like`, {
        method: next ? "POST" : "DELETE",
      });
      const data = await res.json();
      if (!data.success) {
        setLiked(!next);
        setCount((c) => c + (next ? -1 : 1));
        if (res.status === 401) toast("Sign in to like ratings", "info");
        else toast(data.error || "Could not update like", "error");
      } else if (typeof data.data?.likeCount === "number") {
        setCount(data.data.likeCount); // reconcile with the server's true count
      }
    } catch {
      setLiked(!next);
      setCount((c) => c + (next ? -1 : 1));
      toast("Could not update like. Check your connection.", "error");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      onClick={toggle}
      aria-pressed={liked}
      aria-label={liked ? "Unlike" : "Like"}
      className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm transition-colors ${
        liked
          ? "text-earth"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      }`}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill={liked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      <span className="tabular-nums">{count}</span>
    </button>
  );
}
