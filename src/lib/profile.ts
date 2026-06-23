import { cache } from "react";
import { prisma } from "@/lib/db";
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
        // followers = edges where this user is followed; following = edges where
        // they are the follower (named via the Follow relation names).
        _count: { select: { followers: true, following: true } },
        // Profile-wide visibility model: the single `publicProfile` toggle is the
        // switch. When on, ALL of the user's visits show — no per-visit filter.
        // (The visits.visibility column is kept in the schema for a future
        // per-visit/friends-only refinement, but isn't used for gating in v1.)
        visits: {
          select: {
            id: true,
            rating: true,
            comment: true,
            startDate: true,
            endDate: true,
            city: {
              select: {
                id: true,
                name: true,
                country: true,
                latitude: true,
                longitude: true,
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
    };
  }
);
