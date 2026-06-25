"use client";

import { useRef, useState } from "react";
import { uploadPhoto, validatePhoto, downscaleImage } from "@/lib/storage";
import { useToast } from "@/components/ui/Toast";

// Reusable single-image picker. Uploads straight to Supabase Storage and hands
// the resulting public URL up via onChange. `shape="circle"` is for avatars.
export function ImageUpload({
  value,
  onChange,
  folder,
  label,
  shape = "square",
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  folder: string;
  label?: string;
  shape?: "square" | "circle";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file later
    if (!file) return;

    // Reject obviously-wrong types up front (cheap, instant feedback).
    if (!file.type.startsWith("image/")) {
      toast("Please choose a JPG, PNG or WebP image.", "error");
      return;
    }

    setUploading(true);
    try {
      // Shrink big phone photos in the browser, then validate what we'll
      // actually upload (size is checked post-downscale).
      const processed = await downscaleImage(file);
      const err = validatePhoto(processed);
      if (err) {
        toast(err, "error");
        return;
      }
      const url = await uploadPhoto(processed, folder);
      onChange(url);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Upload failed. Try again.";
      toast(message, "error");
    } finally {
      setUploading(false);
    }
  }

  const previewContent = value ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={value} alt="" className="h-full w-full object-cover" />
  ) : (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="text-muted-foreground"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );

  const buttons = (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-60"
      >
        {uploading ? "Uploading…" : value ? "Change photo" : "Upload photo"}
      </button>
      {value && !uploading && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
        >
          Remove
        </button>
      )}
    </>
  );

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-foreground">{label}</label>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFile}
        className="hidden"
      />

      {shape === "circle" ? (
        // Avatar: small round preview with the controls beside it.
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-card">
            {previewContent}
          </div>
          <div className="flex flex-col gap-2">{buttons}</div>
        </div>
      ) : (
        // Photo: full-width preview on top, controls stacked below — cleaner on
        // mobile than squeezing the buttons beside a wide image.
        <div className="space-y-3">
          <div className="flex h-44 w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-card">
            {previewContent}
          </div>
          <div className="flex flex-wrap gap-2">{buttons}</div>
        </div>
      )}
    </div>
  );
}
