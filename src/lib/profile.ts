import { cache } from "react";
import { prisma } from "@/lib/db";
import { badgesForVisits, type BadgeVisit } from "@/lib/badges";
import type { GlobeMarker, PublicProfile } from "@/types";

// Fetch a user's public profile by handle, or null if it doesn't exist or the
// owner hasn't made it public. This is the ONLY place public profile data is
// read, so the field whitelist below is the single trust boundary — email,
// authId, and private/friends-only visits never leave this function.
//
// Wrapped in React cache() so the page render and generateMetadata() (which both
// call it for the same request) share one DB round-trip instead of two.
export const getPublicProfile = cache(
  async (username: string): Promise<PublicProfile | null> => {
    const handle = username.trim().toLowerCase();
    if (!handle) return null;

    const user = await prisma.user.findUnique({
      where: { username: handle },
      // Explicit select = trust boundary: no email/authId can slip out.
      select: {
        id: true, // used only internally below (likes-received count), never returned
        username: true,
        name: true,
        bio: true,
        avatarUrl: true,
        publicProfile: true,
        isPro: true,
        accentColor: true,
        // followers = edges where this user is followed; following = edges where
        // they are the follower (named via the Follow relation names).
        _count: { select: { followers: true, following: true } },
        // Visibility model: the `publicProfile` toggle gates the whole profile,
        // AND each visit must itself be PUBLIC — so a public profile can still
        // hide individual trips (default is PUBLIC, set per visit on the form).
        visits: {
          where: { visibility: "PUBLIC" },
          select: {
            id: true,
            rating: true,
            comment: true,
            startDate: true,
            endDate: true,
            // _count.districts + city.population feed the badge engine below.
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
        },
      },
    });

    if (!user || !user.publicProfile || !user.username) return null;

    // Total likes this user has received across all their shared visits. Counted
    // separately because it spans the visit→like join, not a direct user count.
    const likesReceived = await prisma.visitLike.count({
      where: { visit: { userId: user.id } },
    });

    // Deduplicate by city, keeping the highest-rated visit — mirrors the authed
    // globe in GlobeWrapper so a profile looks identical to the owner's own view.
    const cityMap = new Map<string, GlobeMarker>();
    for (const v of user.visits) {
      const existing = cityMap.get(v.city.id);
      if (!existing || v.rating > existing.rating) {
        cityMap.set(v.city.id, {
          id: v.id,
          cityId: v.city.id,
          cityName: v.city.name,
          country: v.city.country,
          latitude: v.city.latitude,
          longitude: v.city.longitude,
          rating: v.rating,
          startDate: v.startDate.toISOString(),
          endDate: v.endDate ? v.endDate.toISOString() : null,
          comment: v.comment,
        });
      }
    }
    const markers = Array.from(cityMap.values());
    const countries = new Set(markers.map((m) => m.country));

    // Badges + the million-city hero stat, computed from the RAW visits (not the
    // city-deduped markers) so repeat visits and per-month bursts are counted.
    const badgeVisits: BadgeVisit[] = user.visits.map((v) => ({
      rating: v.rating,
      startDate: v.startDate,
      cityId: v.city.id,
      country: v.city.country,
      population: v.city.population,
      latitude: v.city.latitude,
      longitude: v.city.longitude,
      districtCount: v._count.districts,
    }));
    const { stats: badgeStats, badges } = badgesForVisits(badgeVisits);

    return {
      username: user.username,
      name: user.name,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      markers,
      stats: { cities: markers.length, countries: countries.size },
      social: {
        followers: user._count.followers,
        following: user._count.following,
        likes: likesReceived,
      },
      millionCities: badgeStats.millionCities,
      badges,
      isPro: user.isPro,
      // Accent is a Pro perk — ignore any stored value for non-Pro users so a
      // lapsed subscription cleanly reverts to the default brand colour.
      accentColor: user.isPro ? user.accentColor : null,
    };
  }
);
