import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { ratingToColor, ratingToDisplay } from "@/lib/rating";
import { Avatar } from "@/components/ui/Avatar";
import { DISTRICT_FREQUENCIES } from "@/config/constants";

const FREQ_WEIGHT: Record<string, number> = Object.fromEntries(
  DISTRICT_FREQUENCIES.map((f) => [f.value, f.weight])
);

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
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const city = await prisma.city.findUnique({
    where: { id },
    include: {
      visits: {
        where: { userId },
        orderBy: { startDate: "desc" },
        include: { districts: { include: { district: true } } },
      },
    },
  });

  if (!city) notFound();

  const visits = city.visits;
  const hasOwnVisits = visits.length > 0;

  // Cross-discovery: other public users who rated this same city. Ordered by
  // rating desc, then deduped to one row per user (their best rating) — turns a
  // city page into a way to find like-minded travellers. Trust boundary: only
  // public-safe author fields are selected.
  const otherCityVisits = await prisma.visit.findMany({
    where: { cityId: id, userId: { not: userId }, user: { publicProfile: true } },
    orderBy: { rating: "desc" },
    select: {
      rating: true,
      comment: true,
      user: { select: { username: true, name: true, avatarUrl: true } },
    },
  });
  const seenRaters = new Set<string>();
  const otherRaters: {
    username: string;
    name: string | null;
    avatarUrl: string | null;
    rating: number;
    comment: string | null;
  }[] = [];
  for (const v of otherCityVisits) {
    if (!v.user.username || seenRaters.has(v.user.username)) continue;
    seenRaters.add(v.user.username);
    otherRaters.push({
      username: v.user.username,
      name: v.user.name,
      avatarUrl: v.user.avatarUrl,
      rating: v.rating,
      comment: v.comment,
    });
  }

  // Nothing to show if the viewer hasn't been here AND no public user has either.
  if (!hasOwnVisits && otherRaters.length === 0) notFound();

  // Community rating (best visit per other public user) — shown prominently so a
  // city you haven't visited still surfaces what the community thinks.
  const communityRaters = otherRaters.length;
  const communityAvg = communityRaters
    ? Math.round(
        otherRaters.reduce((sum, r) => sum + r.rating, 0) / communityRaters
      )
    : 0;

  // Aggregate district experiences across all visits to this city. Two dimensions
  // kept separate: avgRating (appeal) and weightSum (how much time spent overall),
  // so "most visited" and "best rated" can differ — exactly the planning signal.
  const districtMap = new Map<
    string,
    { name: string; ratingSum: number; count: number; weightSum: number; topWeight: number }
  >();
  for (const v of visits) {
    for (const vd of v.districts) {
      const agg = districtMap.get(vd.districtId) ?? {
        name: vd.district.name,
        ratingSum: 0,
        count: 0,
        weightSum: 0,
        topWeight: 0,
      };
      const weight = FREQ_WEIGHT[vd.frequency] ?? 1;
      agg.ratingSum += vd.rating;
      agg.count += 1;
      agg.weightSum += weight;
      agg.topWeight = Math.max(agg.topWeight, weight);
      districtMap.set(vd.districtId, agg);
    }
  }
  const districts = Array.from(districtMap.values())
    .map((d) => ({
      name: d.name,
      avgRating: Math.round(d.ratingSum / d.count),
      topFrequencyLabel:
        DISTRICT_FREQUENCIES.find((f) => f.weight === d.topWeight)?.label ?? "",
      weightSum: d.weightSum,
    }))
    .sort((a, b) => b.weightSum - a.weightSum || b.avgRating - a.avgRating);
  const avgRating = hasOwnVisits
    ? Math.round(visits.reduce((sum, v) => sum + v.rating, 0) / visits.length)
    : 0;
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

      {hasOwnVisits ? (
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
      ) : (
        <div className="mb-8 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg text-xl font-bold"
              style={{
                backgroundColor: `${ratingToColor(communityAvg)}20`,
                color: ratingToColor(communityAvg),
              }}
            >
              {ratingToDisplay(communityAvg)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">
                Community rating
              </p>
              <p className="text-xs text-muted-foreground">
                from {communityRaters}{" "}
                {communityRaters === 1 ? "traveller" : "travellers"} · you
                haven&apos;t rated it yet
              </p>
            </div>
            <Link
              href="/visits/new"
              className="flex-shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Add yours
            </Link>
          </div>
        </div>
      )}

      {districts.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-1 text-lg font-semibold text-foreground">
            Neighbourhoods
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Sorted by how much time you spent there — rating is how much you liked
            each one.
          </p>
          <div className="space-y-2">
            {districts.map((d, i) => (
              <div
                key={d.name}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
              >
                <div
                  className="flex h-10 w-12 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold"
                  style={{
                    backgroundColor: `${ratingToColor(d.avgRating)}20`,
                    color: ratingToColor(d.avgRating),
                  }}
                >
                  {ratingToDisplay(d.avgRating)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {d.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {d.topFrequencyLabel}
                  </p>
                </div>
                {i === 0 && (
                  <span className="flex-shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    Most visited
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {otherRaters.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-1 text-lg font-semibold text-foreground">
            Who else has been here
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            How other travellers rated {city.name} — tap to see their globe.
          </p>
          <div className="space-y-2">
            {otherRaters.map((r) => {
              const display = r.name ?? `@${r.username}`;
              return (
                <Link
                  key={r.username}
                  href={`/@${r.username}`}
                  className="block rounded-xl border border-border bg-card p-3 transition-colors hover:bg-accent"
                >
                  <div className="flex items-center gap-3">
                    <Avatar src={r.avatarUrl} name={display} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {display}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        @{r.username}
                      </p>
                    </div>
                    <div
                      className="flex h-10 w-12 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold"
                      style={{
                        backgroundColor: `${ratingToColor(r.rating)}20`,
                        color: ratingToColor(r.rating),
                      }}
                    >
                      {ratingToDisplay(r.rating)}
                    </div>
                  </div>
                  {r.comment && (
                    <p className="mt-2 text-sm leading-relaxed text-card-foreground">
                      {r.comment}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {hasOwnVisits && (
        <>
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
              {visit.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={visit.photoUrl}
                  alt={`${city.name} photo`}
                  className="mt-3 max-h-80 w-full rounded-lg object-cover"
                />
              )}
            </div>
          );
        })}
          </div>
        </>
      )}
    </div>
  );
}
