import { prisma } from "@/lib/db";
import type { FeedItem, FeedPage, FeedScope } from "@/types";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

// Cursor = "<ISO createdAt>|<visit id>", base64'd so it's URL-safe and opaque to
// the client. Keyset pagination on (createdAt, id) is stable even as new rows
// arrive at the top — unlike offset paging, which would skip/duplicate items.
function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(`${createdAt.toISOString()}|${id}`).toString("base64url");
}

function decodeCursor(cursor: string): { createdAt: Date; id: string } | null {
  try {
    const [iso, id] = Buffer.from(cursor, "base64url")
      .toString("utf8")
      .split("|");
    const createdAt = new Date(iso);
    if (!id || Number.isNaN(createdAt.getTime())) return null;
    return { createdAt, id };
  } catch {
    return null;
  }
}

/**
 * The shared activity feed: recent public city ratings.
 *
 * This is a trust boundary like getPublicProfile — the `author` select is an
 * explicit whitelist, so email/authId never leave here. Only visits from users
 * with publicProfile = true are ever returned (the profile-wide visibility
 * model), in both scopes.
 *
 * - scope "global": everyone's public ratings (the discover/growth feed).
 * - scope "following": only public ratings from users the viewer follows.
 *
 * `viewerId` may be null (logged-out global feed); then nothing is "liked" or
 * "followed" by the viewer and "following" returns empty.
 */
export async function getFeed({
  viewerId,
  scope,
  cursor,
  limit = DEFAULT_LIMIT,
}: {
  viewerId: string | null;
  scope: FeedScope;
  cursor?: string | null;
  limit?: number;
}): Promise<FeedPage> {
  const take = Math.min(Math.max(limit, 1), MAX_LIMIT);

  // Resolve who the viewer follows once — used to scope the "following" feed and
  // to flag followedByViewer on every card in the "global" feed.
  let followingIds: string[] = [];
  if (viewerId) {
    const edges = await prisma.follow.findMany({
      where: { followerId: viewerId },
      select: { followingId: true },
    });
    followingIds = edges.map((e) => e.followingId);
  }

  // The "following" feed of someone who follows nobody is simply empty.
  if (scope === "following" && followingIds.length === 0) {
    return { items: [], nextCursor: null };
  }

  const authorFilter =
    scope === "following"
      ? { userId: { in: followingIds } }
      : { user: { publicProfile: true } };

  const decoded = cursor ? decodeCursor(cursor) : null;
  const cursorFilter = decoded
    ? {
        OR: [
          { createdAt: { lt: decoded.createdAt } },
          { createdAt: decoded.createdAt, id: { lt: decoded.id } },
        ],
      }
    : {};

  // Always require the author to be public (even in "following": you only see a
  // followed user's ratings while their profile is public).
  const rows = await prisma.visit.findMany({
    where: {
      AND: [{ user: { publicProfile: true } }, authorFilter, cursorFilter],
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: take + 1, // fetch one extra to detect whether another page exists
    select: {
      id: true,
      createdAt: true,
      rating: true,
      comment: true,
      startDate: true,
      endDate: true,
      photoUrl: true,
      userId: true,
      city: { select: { id: true, name: true, country: true } },
      districts: { select: { district: { select: { name: true } } } },
      user: { select: { username: true, name: true, avatarUrl: true } },
      _count: { select: { likes: true, comments: true } },
      likes: viewerId
        ? { where: { userId: viewerId }, select: { id: true } }
        : false,
    },
  });

  const hasMore = rows.length > take;
  const page = hasMore ? rows.slice(0, take) : rows;

  const followingSet = new Set(followingIds);

  const items: FeedItem[] = page
    // Defensive: a public visit from a user who never set a username can't link
    // to a profile, so it has no place in the feed.
    .filter((r) => r.user.username)
    .map((r) => ({
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      rating: r.rating,
      comment: r.comment,
      startDate: r.startDate.toISOString(),
      endDate: r.endDate ? r.endDate.toISOString() : null,
      photoUrl: r.photoUrl,
      city: { id: r.city.id, name: r.city.name, country: r.city.country },
      districts: r.districts.map((d) => d.district.name),
      author: {
        username: r.user.username as string,
        name: r.user.name,
        avatarUrl: r.user.avatarUrl,
      },
      likeCount: r._count.likes,
      likedByViewer: Array.isArray(r.likes) ? r.likes.length > 0 : false,
      commentCount: r._count.comments,
      followedByViewer: followingSet.has(r.userId),
      isOwn: viewerId === r.userId,
    }));

  const last = page[page.length - 1];
  const nextCursor =
    hasMore && last ? encodeCursor(last.createdAt, last.id) : null;

  return { items, nextCursor };
}
