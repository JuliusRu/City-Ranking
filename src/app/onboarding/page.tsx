"use client";

import { useState } from "react";
import { CityStep } from "@/components/onboarding/CityStep";
import { IdentityStep } from "@/components/onboarding/IdentityStep";
import { PayoffStep } from "@/components/onboarding/PayoffStep";

const STEPS = ["Cities", "Handle", "Done"] as const;

export default function OnboardingPage() {
  const [step, setStep] = useState(0); // 0 = cities, 1 = identity, 2 = payoff
  const [finishing, setFinishing] = useState(false);

  // Mark onboarding complete server-side (stamps users.onboarded_at) so the
  // home-page redirect never sends the user back here, then go to the globe.
  async function finish() {
    setFinishing(true);
    try {
      await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboarded: true }),
      });
    } catch {
      // Even if the flag write fails, don't trap the user — send them on. The
      // worst case is they see onboarding once more next visit.
    }
    // Full navigation so the server re-renders the now-populated globe.
    window.location.assign("/");
  }

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col gap-6 px-4 py-8 sm:py-12">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`h-2 rounded-full transition-all ${
                i === step
                  ? "w-6 bg-primary"
                  : i < step
                    ? "w-2 bg-primary"
                    : "w-2 bg-border"
              }`}
            />
          </div>
        ))}
      </div>

      {step === 0 && <CityStep onComplete={() => setStep(1)} />}
      {step === 1 && (
        <IdentityStep onDone={() => setStep(2)} onSkip={() => setStep(2)} />
      )}
      {step === 2 && <PayoffStep onFinish={finish} finishing={finishing} />}
    </div>
  );
}
