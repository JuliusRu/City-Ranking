import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { ratingToColor, ratingToDisplay } from "@/lib/rating";

function formatDateRange(startDate: Date, endDate: Date | null): string {
  const opts: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" };
  if (!endDate) return startDate.toLocaleDateString("en-US", opts);
  const startStr = startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endStr = endDate.toLocaleDateString("en-US", opts);
  return `${startStr} - ${endStr}`;
}

function getDuration(startDate: Date, endDate: Date | null): string {
  if (!endDate) return "Day trip";
  const diff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return "Day trip";
  return `${diff} day${diff > 1 ? "s" : ""}`;
}

export default async function CityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = getCurrentUserId();

  const city = await prisma.city.findUnique({
    where: { id },
    include: {
      visits: {
        where: { userId },
        orderBy: { startDate: "desc" },
      },
    },
  });

  if (!city || city.visits.length === 0) notFound();

  const visits = city.visits;
  const avgRating = Math.round(
    visits.reduce((sum, v) => sum + v.rating, 0) / visits.length
  );
  const totalDays = visits.reduce((sum, v) => {
    if (!v.endDate) return sum + 1;
    const diff = Math.ceil(
      (v.endDate.getTime() - v.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return sum + Math.max(diff, 1);
  }, 0);

  return (
    <div className="mx-auto max-w-3xl p-6">
      <Link
        href="/cities"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to Cities
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{city.name}</h1>
        <p className="text-muted-foreground">
          {[city.state, city.country].filter(Boolean).join(", ")}
        </p>
      </div>

      <div className="mb-8 flex gap-6 rounded-xl border border-border bg-card p-5">
        <div className="text-center">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg text-xl font-bold"
            style={{
              backgroundColor: `${ratingToColor(avgRating)}20`,
              color: ratingToColor(avgRating),
            }}
          >
            {ratingToDisplay(avgRating)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Avg Rating</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-foreground">{visits.length}</p>
          <p className="text-xs text-muted-foreground">{visits.length === 1 ? "Visit" : "Visits"}</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-foreground">{totalDays}</p>
          <p className="text-xs text-muted-foreground">{totalDays === 1 ? "Day" : "Days"}</p>
        </div>
      </div>

      <h2 className="mb-4 text-lg font-semibold text-foreground">All Visits</h2>
      <div className="space-y-3">
        {visits.map((visit) => {
          const pills = [visit.tripType, visit.budgetLevel, visit.transport].filter(Boolean);
          return (
            <div
              key={visit.id}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold"
                    style={{
                      backgroundColor: `${ratingToColor(visit.rating)}20`,
                      color: ratingToColor(visit.rating),
                    }}
                  >
                    {ratingToDisplay(visit.rating)}
                  </div>
                  <div>
                    <p className="text-sm text-foreground">
                      {formatDateRange(visit.startDate, visit.endDate)}
                      <span className="mx-1.5 text-border">|</span>
                      <span className="text-muted-foreground">
                        {getDuration(visit.startDate, visit.endDate)}
                      </span>
                    </p>
                    {pills.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {pills.map((pill) => (
                          <span
                            key={pill}
                            className="rounded-full bg-accent px-2 py-0.5 text-xs capitalize text-muted-foreground"
                          >
                            {pill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <Link
                  href={`/visits/${visit.id}`}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                  aria-label="Edit visit"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M11.333 2A1.886 1.886 0 0 1 14 4.667l-9 9-3.667 1 1-3.667 9-9Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              </div>
              {visit.comment && (
                <p className="mt-2 text-sm leading-relaxed text-card-foreground">
                  {visit.comment}
                </p>
              )}
              {visit.highlights && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Highlights: {visit.highlights}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
