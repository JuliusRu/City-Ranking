"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

// Beta feedback widget: a small header button that opens a modal to send a note.
// Stores via POST /api/feedback (no mail client / external dependency needed).
export function FeedbackButton({
  variant = "compact",
}: {
  // "compact" = header pill; "menu" = full-width row for the mobile menu.
  variant?: "compact" | "menu";
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  async function send() {
    if (message.trim().length < 3 || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          email: email.trim() || undefined,
          path: typeof window !== "undefined" ? window.location.pathname : undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast("Thanks! Your feedback was sent.", "success");
        setMessage("");
        setEmail("");
        setOpen(false);
      } else {
        toast(json.error ?? "Could not send feedback.", "error");
      }
    } catch {
      toast("Could not reach the server. Check your connection.", "error");
    } finally {
      setSending(false);
    }
  }

  const trigger =
    variant === "menu" ? (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg px-4 py-3 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        Feedback
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:flex"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Feedback
      </button>
    );

  return (
    <>
      {trigger}
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Send feedback">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This is an early beta — tell us what felt off, what&apos;s missing, or
            what you loved. It all helps.
          </p>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            maxLength={4000}
            autoFocus
            placeholder="What's on your mind?"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted-foreground">
              Email <span className="text-xs">(optional, if you want a reply)</span>
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={sending}>
              Cancel
            </Button>
            <Button onClick={send} disabled={message.trim().length < 3 || sending}>
              {sending ? "Sending…" : "Send feedback"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
