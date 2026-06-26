"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";

// Step 2: claim a @username so the map becomes a shareable identity. Reuses the
// same PATCH /api/user contract as Settings (incl. the 409 "username taken" and
// format validation messages the route already returns). Fully skippable.
export function IdentityStep({
  onDone,
  onSkip,
}: {
  onDone: () => void;
  onSkip: () => void;
}) {
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!username.trim() || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          bio: bio.trim() || null,
          publicProfile: true,
        }),
      });
      const json = await res.json();
      if (json.success) {
        onDone();
      } else {
        // Surface the first validation issue (reserved/format) or the 409.
        toast(json.issues?.[0]?.message ?? json.error ?? "Failed to save", "error");
        setSaving(false);
      }
    } catch {
      toast("Could not reach the server. Check your connection.", "error");
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">Claim your handle</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a username so you can share your map. You can always change it
          later in settings.
        </p>
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-foreground">Username</span>
        <div className="flex items-center rounded-xl border border-border bg-background px-3 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
          <span className="text-sm text-muted-foreground">@</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            maxLength={20}
            placeholder="yourname"
            className="h-11 flex-1 bg-transparent px-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
        <span className="text-xs text-muted-foreground">
          3–20 characters · lowercase letters, numbers, underscores
        </span>
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-foreground">
          Bio <span className="font-normal text-muted-foreground">(optional)</span>
        </span>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={2}
          maxLength={280}
          placeholder="Traveller, city-collector, district-hunter…"
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </label>

      <p className="rounded-lg border border-border bg-background px-3 py-2 text-xs leading-relaxed text-muted-foreground">
        Claiming a handle makes your profile <span className="text-foreground">public</span> —
        anyone with the link can see your map. You can turn this off anytime in
        settings, or hide single trips. Prefer to stay private? Just tap “Maybe
        later”.
      </p>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onSkip}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Maybe later
        </button>
        <Button onClick={save} disabled={!username.trim() || saving}>
          {saving ? "Saving…" : "Continue"}
        </Button>
      </div>
    </div>
  );
}
