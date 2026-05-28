import { getSessionUser } from "@/lib/auth";
import { GlobeClient } from "@/components/globe/GlobeClient";
import { Landing } from "@/components/landing/Landing";

export default async function HomePage() {
  const user = await getSessionUser();
  if (!user) return <Landing />;
  return <GlobeClient />;
}
