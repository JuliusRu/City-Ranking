"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { ParsedVisit } from "@/types";

// Free-text / dictation entry: paste or speak a note, AI fills the form. The
// extracted result is handed up so the page can switch to the pre-filled form
// for review — the manual form is never bypassed.
export function QuickAdd({
  onExtracted,
}: {
  onExtracted: (parsed: ParsedVisit) => void;
}) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function extract() {
    if (!text.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/visits/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (data.success) {
        onExtracted(data.data as ParsedVisit);
      } else if (res.status === 401) {
        toast("Please sign in.", "info");
      } else {
        toast(data.error || "Could not read your note.", "error");
      }
    } catch {
      toast("Could not reach the server. Check your connection.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Speak or type freely — where you were, how it was, when. We&apos;ll fill
        in the form for you to check.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        maxLength={4000}
        autoFocus
        placeholder="e.g. Spent a week in Lisbon last summer — loved it, 9 out of 10. Amazing food, stayed in Alfama, would definitely go back."
        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{text.length}/4000</span>
        <Button onClick={extract} disabled={!text.trim() || loading}>
          {loading ? "Reading…" : "✨ Fill the form for me"}
        </Button>
      </div>
    </div>
  );
}
