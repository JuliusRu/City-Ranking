import Link from "next/link";

const features = [
  {
    title: "Your travels on a 3D globe",
    body: "Every city you've visited, scored and pinned on an interactive globe — your world at a glance.",
  },
  {
    title: "Rank, don't just bookmark",
    body: "Give each place a personal rating and notes. It's a journal, not a dead Google Maps list.",
  },
  {
    title: "Share your ranking",
    body: "Publish a public profile and compare with friends. Restaurants & bars per city coming next.",
  },
];

export function Landing() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-10 px-6 py-16 text-center">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Rank every city you&apos;ve ever visited.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            A personal travel journal on an interactive 3D globe. Score the
            places you&apos;ve been, see your world at a glance, and share your
            ranking. Free for travelers and digital nomads.
          </p>
          <div className="mt-2 flex gap-3">
            <Link
              href="/login"
              className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Get started — it&apos;s free
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-accent"
            >
              Sign in
            </Link>
          </div>
        </div>

        <div className="grid w-full gap-4 sm:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-border bg-card p-5 text-left"
            >
              <h2 className="mb-1 text-sm font-semibold">{f.title}</h2>
              <p className="text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
