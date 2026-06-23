"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";

// Follow/unfollow toggle. Used on feed cards and on public profiles. Optimistic,
// with rollback on failure. `size="sm"` is the compact variant for feed cards.
export function FollowButton({
  username,
  initialFollowing,
  size = "md",
  onChange,
}: {
  username: string;
  initialFollowing: boolean;
  size?: "sm" | "md";
  onChange?: (following: boolean) => void;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, setPending] = useState(false);
  const { toast } = useToast();

  async function toggle() {
    if (pending) return;
    const next = !following;

    setFollowing(next);
    setPending(true);
    onChange?.(next);

    try {
      const res = await fetch("/api/follow", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (!data.success) {
        setFollowing(!next);
        onChange?.(!next);
        if (res.status === 401) toast("Sign in to follow", "info");
        else toast(data.error || "Could not update", "error");
      }
    } catch {
      setFollowing(!next);
      onChange?.(!next);
      toast("Could not update. Check your connection.", "error");
    } finally {
      setPending(false);
    }
  }

  const sizing = size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm";

  return (
    <button
      onClick={toggle}
      disabled={pending}
      aria-pressed={following}
      className={`flex-shrink-0 rounded-full font-medium transition-colors disabled:opacity-60 ${sizing} ${
        following
          ? "border border-border text-muted-foreground hover:border-destructive/50 hover:text-destructive"
          : "bg-primary text-primary-foreground hover:opacity-90"
      }`}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
