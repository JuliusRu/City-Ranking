import { createClient } from "@/lib/supabase/client";

// Single public bucket for all user photos (visit/venue/avatar). Create it in
// the Supabase dashboard as PUBLIC, with an authenticated-insert policy scoped
// to the user's own folder (see the setup notes in the PR / chat).
export const PHOTO_BUCKET = "photos";

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB
export const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Reject oversized or non-image files before we hit the network. Returns an
// error message, or null when the file is acceptable.
export function validatePhoto(file: File): string | null {
  if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
    return "Please choose a JPG, PNG or WebP image.";
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return "Image must be 5 MB or smaller.";
  }
  return null;
}

/**
 * Upload an image to Supabase Storage from the browser and return its public
 * URL. The path is namespaced by the user's auth id so the bucket's RLS policy
 * can restrict writes to a user's own folder. `folder` groups by entity type
 * (e.g. "visits", "venues", "avatars").
 */
export async function uploadPhoto(file: File, folder: string): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in to upload.");

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${user.id}/${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// Best-effort delete of a previously uploaded photo by its public URL. The
// storage path is everything after ".../object/public/<bucket>/". Failures are
// swallowed — an orphaned file is harmless and shouldn't block the user action.
export async function deletePhoto(publicUrl: string): Promise<void> {
  try {
    const marker = `/object/public/${PHOTO_BUCKET}/`;
    const idx = publicUrl.indexOf(marker);
    if (idx === -1) return;
    const path = publicUrl.slice(idx + marker.length);
    const supabase = createClient();
    await supabase.storage.from(PHOTO_BUCKET).remove([path]);
  } catch {
    // ignore — orphan cleanup is not critical
  }
}
