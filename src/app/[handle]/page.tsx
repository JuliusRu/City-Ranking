import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicProfile } from "@/lib/profile";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { PublicGlobe } from "@/components/globe/PublicGlobe";
import { CopyLinkButton } from "@/components/profile/CopyLinkButton";
import { FollowButton } from "@/components/feed/FollowButton";
import { Avatar } from "@/components/ui/Avatar";
import { SITE_URL } from "@/config/constants";

// Resolve the viewer's relationship to this profile: are they the owner, and (if
// not) do they already follow? Returns null for logged-out viewers so the page
// shows no follow control. Kept out of getPublicProfile so that function stays a
// pure public-data trust boundary.
async function getFollowState(
  username: string
): Promise<{ isOwn: boolean; following: boolean } | null> {
  const viewerId = await getCurrentUserId();
  if (!viewerId) return null;

  const target = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  if (!target) return null;
  if (target.id === viewerId) return { isOwn: true, following: false };

  const edge = await prisma.follow.findUnique({
    where: {
      followerId_followingId: { followerId: viewerId, followingId: target.id },
    },
    select: { id: true },
  });
  return { isOwn: false, following: Boolean(edge) };
}

// Next reserves folder names beginning with @ for parallel-route slots, so the
// /@handle URL can't be a literal folder. Instead this root dynamic segment
// catches /<anything>; we only treat it as a profile when it starts with "@".
// Static routes (/login, /settings, /cities…) still win over this dynamic match.
function parseHandle(raw: string): string | null {
  const decoded = decodeURIComponent(raw);
  if (!decoded.startsWith("@")) return null;
  return decoded.slice(1).toLowerCase();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const username = parseHandle(handle);
  if (!username) return {};

  const profile = await getPublicProfile(username);
  if (!profile) return { title: "Profile not found · ranking.place" };

  const displayName = profile.name ?? `@${profile.username}`;
  const title = `${displayName} on ranking.place`;
  const description =
    profile.bio ??
    `${profile.stats.cities} cities across ${profile.stats.countries} countries on an interactive 3D globe.`;

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/@${profile.username}`,
      type: "profile",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const username = parseHandle(handle);
  if (!username) notFound();

  const profile = await getPublicProfile(username);
  if (!profile) notFound();

  const followState = await getFollowState(username);
  const displayName = profile.name ?? `@${profile.username}`;
  const shareUrl = `${SITE_URL}/@${profile.username}`;

  return (
    <div className="relative h-full w-full">
      <PublicGlobe markers={profile.markers} />

      {/* Profile header — top-center overlay, clear of the sidebar (top-left)
          and city info panel (top-right). */}
      <div className="pointer-events-none absolute left-1/2 top-3 z-20 w-[calc(100vw-1rem)] max-w-md -translate-x-1/2 sm:top-4">
        <div className="pointer-events-auto rounded-2xl border border-border bg-card/95 p-4 shadow-2xl backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Avatar
              src={profile.avatarUrl}
              name={displayName}
              size={48}
              className="text-lg"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-foreground">
                {displayName}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                @{profile.username}
              </p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              {followState && !followState.isOwn && (
                <FollowButton
                  username={profile.username}
                  initialFollowing={followState.following}
                />
              )}
              <CopyLinkButton url={shareUrl} />
            </div>
          </div>

          {profile.bio && (
            <p className="mt-3 text-sm leading-relaxed text-card-foreground">
              {profile.bio}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <span className="text-foreground">
              <span className="font-semibold">{profile.stats.cities}</span>{" "}
              <span className="text-muted-foreground">cities</span>
            </span>
            <span className="text-foreground">
              <span className="font-semibold">{profile.stats.countries}</span>{" "}
              <span className="text-muted-foreground">countries</span>
            </span>
            <span className="text-foreground">
              <span className="font-semibold">{profile.social.followers}</span>{" "}
              <span className="text-muted-foreground">
                {profile.social.followers === 1 ? "follower" : "followers"}
              </span>
            </span>
            <span className="text-foreground">
              <span className="font-semibold">{profile.social.following}</span>{" "}
              <span className="text-muted-foreground">following</span>
            </span>
            <span className="text-foreground">
              <span className="font-semibold">{profile.social.likes}</span>{" "}
              <span className="text-muted-foreground">
                {profile.social.likes === 1 ? "like" : "likes"}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
