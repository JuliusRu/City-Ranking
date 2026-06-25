import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { apiSuccess, apiError, apiUnauthorized } from "@/lib/api-response";
import { badgesForVisits, type BadgeVisit } from "@/lib/badges";

// Payoff data for the final onboarding step: the freshly-earned achievements,
// computed from the user's just-created visits. Same computation as the public
// profile (src/lib/profile.ts) but scoped to the current authed user.
export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return apiUnauthorized();

    const visits = await prisma.visit.findMany({
      where: { userId },
      select: {
        rating: true,
        startDate: true,
        _count: { select: { districts: true } },
        city: {
          select: {
            id: true,
            name: true,
            country: true,
            latitude: true,
            longitude: true,
            population: true,
          },
        },
      },
    });

    const badgeVisits: BadgeVisit[] = visits.map((v) => ({
      rating: v.rating,
      startDate: v.startDate,
      cityId: v.city.id,
      country: v.city.country,
      population: v.city.population,
      latitude: v.city.latitude,
      longitude: v.city.longitude,
      districtCount: v._count.districts,
    }));

    const { stats, badges } = badgesForVisits(badgeVisits);

    return apiSuccess({
      cityCount: stats.cityCount,
      countries: stats.countries,
      millionCities: stats.millionCities,
      badges,
    });
  } catch (error) {
    console.error("GET /api/onboarding/summary error:", error);
    return apiError("Failed to load your summary");
  }
}
