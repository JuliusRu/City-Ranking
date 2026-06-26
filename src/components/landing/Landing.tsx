import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { LandingGlobe } from "./LandingGlobe";

// Illustrative numbers — show the "quantified self" payoff, don't just describe it.
const showcaseStats = [
  { n: "23", label: "million-cities" },
  { n: "61", label: "cities" },
  { n: "18", label: "countries" },
  { n: "5", label: "continents" },
];

const valueProps = [
  {
    emoji: "📊",
    title: "Your life, in numbers",
    body: "Million-cities, countries, continents — a running score that climbs as you go. The fun, slightly pointless stats you'll actually want to share.",
  },
  {
    emoji: "🌍",
    title: "Yours to keep — or share",
    body: "Everywhere you've been on one 3D globe. Keep it completely private, or share the whole thing with a single link — not 200 buried Instagram posts.",
  },
  {
    emoji: "🗺️",
    title: "Honest, down to the district",
    body: "Rate places the way you actually saw them — neighbourhood by neighbourhood. No standardized tables, no fake objectivity.",
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
            Log everywhere you&apos;ve slept, rate it your way, and watch your
            travel stats stack up — on a 3D globe you can actually share. ~500
            million-cities worldwide. How far will you get?
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

      {/* Stats showcase — make the "quantified self" payoff tangible */}
      <section className="mx-auto max-w-6xl px-5 pb-12 sm:px-8">
        <div className="rounded-2xl border border-border bg-card px-6 py-8 sm:py-10">
          <p className="text-center text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Your life, in numbers worth sharing
          </p>
          <div className="mt-6 flex flex-wrap items-end justify-center gap-x-10 gap-y-6 sm:gap-x-16">
            {showcaseStats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-4xl font-semibold tracking-tight text-gradient-brand sm:text-5xl">
                  {s.n}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-6 max-w-lg text-center text-sm text-muted-foreground">
            Instagram never told you you&apos;ve slept in 23 million-cities — or
            that you&apos;ve been to 5 continents. We do, and you can share the
            whole map with a single link.
          </p>
        </div>
      </section>

      {/* Value props */}
      <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
        <h2 className="mb-8 text-center text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Why you&apos;ll keep coming back
        </h2>
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
        <p className="mt-6 text-center text-sm text-muted-foreground">
          And soon — discover your next trip through travellers whose taste
          actually matches yours.{" "}
          <span className="text-foreground/70">Not average scores. People.</span>
        </p>
      </section>

      {/* Same place, different eyes — the comparison heart (the origin idea) */}
      <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
        <div className="grid items-center gap-8 rounded-2xl border border-border bg-card p-6 sm:p-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              The same place, through different eyes
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              You walked Lisbon in golden spring and called it magic. A friend hit
              it in grey, drizzly January and shrugged. Same city — two honest
              rankings, because nobody sees a place the same way.
            </p>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Follow the people you actually travel-talk with and compare the cities
              you&apos;ve both been to.{" "}
              <span className="text-foreground/70">
                It&apos;s literally why this exists — one of us kept the list on
                paper, the other in his head. We just wanted to compare.
              </span>
            </p>
          </div>

          {/* Two contrasting takes on one city — show the idea, don't just say it */}
          <div className="flex flex-col gap-3">
            {[
              { who: "You · summer", score: 88, color: "#6f9b5e", note: "Parks in full bloom, long golden evenings. Felt alive." },
              { who: "Leon · winter", score: 54, color: "#c08552", note: "Grey, drizzly, everything overpriced. Couldn't wait to leave." },
            ].map((t) => (
              <div
                key={t.who}
                className="flex items-start gap-3 rounded-xl border border-border bg-background p-4"
              >
                <div
                  className="flex h-11 w-12 flex-shrink-0 items-center justify-center rounded-lg text-base font-bold"
                  style={{ backgroundColor: `${t.color}22`, color: t.color }}
                >
                  {(t.score / 10).toFixed(1)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    London{" "}
                    <span className="font-normal text-muted-foreground">
                      · {t.who}
                    </span>
                  </p>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                    {t.note}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <div className="flex flex-col items-center gap-5 rounded-3xl border border-border bg-card px-6 py-12 text-center">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
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
          <nav className="flex items-center gap-4">
            <Link href="/impressum" className="transition-colors hover:text-foreground">
              Impressum
            </Link>
            <Link href="/datenschutz" className="transition-colors hover:text-foreground">
              Datenschutz
            </Link>
          </nav>
          <p>Your world, ranked. © {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
