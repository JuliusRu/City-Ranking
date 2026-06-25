import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { GlobeClient } from "@/components/globe/GlobeClient";
import { Landing } from "@/components/landing/Landing";

export default async function HomePage() {
  // getCurrentUserId upserts the local profile on first login and returns null
  // when signed out — so a null id means "show the public landing".
  const userId = await getCurrentUserId();
  if (!userId) return <Landing />;

  // First-run gate: until the user finishes (or skips) onboarding, onboarded_at
  // is null and we send them through the guided flow exactly once.
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { onboardedAt: true },
  });
  if (!dbUser?.onboardedAt) redirect("/onboarding");

  return <GlobeClient />;
}
