"use client";

import { Button } from "@/components/ui/Button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <h2 className="mb-2 text-xl font-semibold text-foreground">
          Something went wrong
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">{error.message}</p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
