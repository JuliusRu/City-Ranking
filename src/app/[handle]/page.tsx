import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicProfile } from "@/lib/profile";
import { PublicGlobe } from "@/components/globe/PublicGlobe";
import { CopyLinkButton } from "@/components/profile/CopyLinkButton";
import { SITE_URL } from "@/config/constants";

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

  const displayName = profile.name ?? `@${profile.username}`;
  const initial = (profile.name ?? profile.username).charAt(0).toUpperCase();
  const shareUrl = `${SITE_URL}/@${profile.username}`;

  return (
    <div className="relative h-full w-full">
      <PublicGlobe markers={profile.markers} />

      {/* Profile header — top-center overlay, clear of the sidebar (top-left)
          and city info panel (top-right). */}
      <div className="pointer-events-none absolute left-1/2 top-3 z-20 w-[calc(100vw-1rem)] max-w-md -translate-x-1/2 sm:top-4">
        <div className="pointer-events-auto rounded-2xl border border-border bg-card/95 p-4 shadow-2xl backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-foreground">
                {displayName}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                @{profile.username}
              </p>
            </div>
            <CopyLinkButton url={shareUrl} />
          </div>

          {profile.bio && (
            <p className="mt-3 text-sm leading-relaxed text-card-foreground">
              {profile.bio}
            </p>
          )}

          <div className="mt-3 flex gap-4 text-sm">
            <span className="text-foreground">
              <span className="font-semibold">{profile.stats.cities}</span>{" "}
              <span className="text-muted-foreground">cities</span>
            </span>
            <span className="text-foreground">
              <span className="font-semibold">{profile.stats.countries}</span>{" "}
              <span className="text-muted-foreground">countries</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
