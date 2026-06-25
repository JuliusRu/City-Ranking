import { createClient } from "@/lib/supabase/client";

// Single public bucket for all user photos (visit/venue/avatar). Create it in
// the Supabase dashboard as PUBLIC, with an authenticated-insert policy scoped
// to the user's own folder (see the setup notes in the PR / chat).
export const PHOTO_BUCKET = "photos";

// Safety-net cap, checked AFTER client-side downscaling — so a normal phone
// photo (which shrinks to well under 1 MB) never trips it; only a pathological
// file that failed to downscale would. Phone cameras routinely produce 5–10 MB.
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10 MB
export const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Longest edge we keep — plenty for a feed/profile photo, tiny to store.
const MAX_DIMENSION = 2048;
const JPEG_QUALITY = 0.82;

// Reject oversized or non-image files before we hit the network. Returns an
// error message, or null when the file is acceptable.
export function validatePhoto(file: File): string | null {
  if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
    return "Please choose a JPG, PNG or WebP image.";
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return "Image must be 10 MB or smaller.";
  }
  return null;
}

/**
 * Downscale + re-encode a chosen image in the browser before upload. Caps the
 * longest edge at MAX_DIMENSION and re-encodes as JPEG, which: keeps uploads
 * fast, keeps Supabase Storage usage tiny (1 GB free tier), sidesteps both the
 * app and bucket size limits, and strips EXIF (incl. GPS) for privacy. Any
 * failure (or a file that wouldn't get smaller) falls back to the original.
 */
export async function downscaleImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("decode failed"));
      i.src = url;
    });

    const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
    // Already small in both dimensions and bytes → don't bother re-encoding.
    if (scale === 1 && file.size <= 1_500_000) return file;

    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, w, h);

    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, "image/jpeg", JPEG_QUALITY)
    );
    if (!blob || blob.size >= file.size) return file; // no win → keep original

    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg" });
  } catch {
    return file; // on any error, upload the original and let validation decide
  } finally {
    URL.revokeObjectURL(url);
  }
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
