"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { VisitForm } from "@/components/visits/VisitForm";
import { QuickAdd } from "@/components/visits/QuickAdd";
import type { ParsedVisit } from "@/types";

export default function NewVisitPage() {
  const [mode, setMode] = useState<"form" | "text">("form");
  const [prefill, setPrefill] = useState<ParsedVisit | null>(null);

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      <h1 className="mb-4 text-3xl font-semibold tracking-tight">Add Visit</h1>

      {/* Mode toggle: the manual form is the default; "From text" is the AI turbo. */}
      <div className="mb-4 flex gap-1 rounded-lg border border-border bg-card p-1">
        <button
          onClick={() => setMode("form")}
          aria-current={mode === "form" ? "page" : undefined}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            mode === "form"
              ? "bg-gradient-brand text-white"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          Manual
        </button>
        <button
          onClick={() => setMode("text")}
          aria-current={mode === "text" ? "page" : undefined}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            mode === "text"
              ? "bg-gradient-brand text-white"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          ✨ From text
        </button>
      </div>

      <Card>
        {mode === "text" ? (
          <QuickAdd
            onExtracted={(parsed) => {
              setPrefill(parsed);
              setMode("form");
            }}
          />
        ) : (
          // key forces a fresh mount when prefill arrives, so the form re-seeds
          // its initial state from the extracted values.
          <VisitForm key={prefill ? "prefilled" : "blank"} prefill={prefill} />
        )}
      </Card>
    </div>
  );
}
