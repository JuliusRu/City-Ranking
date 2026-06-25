import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { LandingGlobe } from "./LandingGlobe";

const valueProps = [
  {
    emoji: "🌆",
    title: "Collect your world",
    body: "Million-cities, badges, your running score. It's a collection game — not a dead checklist.",
  },
  {
    emoji: "🗺️",
    title: "Honest, down to the district",
    body: "Rate cities the way you actually saw them — neighbourhood by neighbourhood. No standardized tables.",
  },
  {
    emoji: "👥",
    title: "Discover through people",
    body: "Find your next trip through travellers whose taste matches yours — not through average scores.",
  },
];

export function Landing() {
  return (
    <div className="h-full overflow-y-auto">
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col items-start">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Logo className="h-4 w-4 text-primary" />
            Your travel collection game
          </span>

          <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-gradient-brand sm:text-5xl lg:text-6xl">
            How many of the world&apos;s million-cities have you slept in?
          </h1>

          <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">
            Collect every city you&apos;ve slept in, rate it your way, and share
            your map. ~500 million-cities worldwide — how far will you get?
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-xl bg-gradient-brand px-6 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            >
              Start your map — free
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
            >
              Sign in
            </Link>
          </div>
        </div>

        <LandingGlobe />
      </section>

      {/* Value props */}
      <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
        <div className="grid gap-5 sm:grid-cols-3">
          {valueProps.map((v) => (
            <div
              key={v.title}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-brand text-xl shadow-sm">
                <span aria-hidden>{v.emoji}</span>
              </div>
              <h2 className="mb-1.5 text-base font-semibold text-foreground">
                {v.title}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {v.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <div className="flex flex-col items-center gap-5 rounded-3xl border border-border bg-card px-6 py-12 text-center">
          <h2 className="text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Ready to start collecting?
          </h2>
          <p className="max-w-md text-muted-foreground">
            Free for travellers and digital nomads. Build your map in minutes.
          </p>
          <Link
            href="/login"
            className="rounded-xl bg-gradient-brand px-6 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
          >
            Start your map — free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:px-8">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <Logo className="h-5 w-5 text-primary" />
            ranking.place
          </div>
          <p>Your world, ranked. © {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
