"use client";

import { useRef, useState } from "react";
import { uploadPhoto, validatePhoto } from "@/lib/storage";
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

    const err = validatePhoto(file);
    if (err) {
      toast(err, "error");
      return;
    }

    setUploading(true);
    try {
      const url = await uploadPhoto(file, folder);
      onChange(url);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Upload failed. Try again.";
      toast(message, "error");
    } finally {
      setUploading(false);
    }
  }

  const preview = shape === "circle" ? "h-20 w-20 rounded-full" : "h-40 w-full rounded-xl";

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-foreground">{label}</label>
      )}

      <div className="flex items-center gap-4">
        <div
          className={`${preview} flex flex-shrink-0 items-center justify-center overflow-hidden border border-border bg-card ${
            shape === "square" ? "max-w-xs" : ""
          }`}
        >
          {value ? (
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
          )}
        </div>

        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-60"
          >
            {uploading ? "Uploading…" : value ? "Change photo" : "Upload photo"}
          </button>
          {value && !uploading && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-left text-sm text-muted-foreground hover:text-destructive"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
