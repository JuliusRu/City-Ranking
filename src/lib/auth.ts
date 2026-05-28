import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";

// The authenticated Supabase user for the current request, or null.
export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// Resolve the local User.id for the current session, creating the profile on
// first login (linked to the Supabase auth uid). Returns null when not signed in.
export async function getCurrentUserId(): Promise<string | null> {
  const authUser = await getSessionUser();
  if (!authUser) return null;

  const user = await prisma.user.upsert({
    where: { authId: authUser.id },
    update: {},
    create: { authId: authUser.id, email: authUser.email ?? null },
  });
  return user.id;
}
