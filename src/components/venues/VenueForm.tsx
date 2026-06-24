"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Rating } from "@/components/ui/Rating";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { useToast } from "@/components/ui/Toast";
import { VENUE_TYPES, BUDGET_LEVELS } from "@/config/constants";
import type { VenueData, VenueType } from "@/types";

interface VenueFormProps {
  venue?: VenueData | null;
}

export function VenueForm({ venue }: VenueFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEditing = !!venue;

  const [name, setName] = useState(venue?.name ?? "");
  const [type, setType] = useState<VenueType>(venue?.type ?? "RESTAURANT");
  const [rating, setRating] = useState(venue?.rating ?? 50);
  const [location, setLocation] = useState(venue?.location ?? "");
  const [priceLevel, setPriceLevel] = useState(venue?.priceLevel ?? "");
  const [note, setNote] = useState(venue?.note ?? "");
  const [wouldReturn, setWouldReturn] = useState(venue?.wouldReturn ?? null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(venue?.photoUrl ?? null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    if (!name.trim()) {
      setErrors({ name: "Please enter a name" });
      return;
    }

    setIsSubmitting(true);
    try {
      const url = isEditing ? `/api/venues/${venue.id}` : "/api/venues";
      const method = isEditing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type,
          rating,
          location: location.trim() || null,
          priceLevel: priceLevel || null,
          note: note.trim() || null,
          wouldReturn,
          photoUrl,
        }),
      });
      const data = await res.json();

      if (data.success) {
        toast(isEditing ? `${name} updated` : `${name} added!`, "success");
        router.push("/places");
        router.refresh();
      } else if (data.issues) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of data.issues) fieldErrors[issue.path] = issue.message;
        setErrors(fieldErrors);
      } else {
        setErrors({ form: data.error || "Something went wrong" });
      }
    } catch {
      setErrors({ form: "Could not save. Check your connection and try again." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.form && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {errors.form}
        </div>
      )}

      <Input
        id="name"
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Time Out Market"
        error={errors.name}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="type" className="block text-sm font-medium text-foreground">
            Type
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as VenueType)}
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {VENUE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="priceLevel" className="block text-sm font-medium text-foreground">
            Price (optional)
          </label>
          <select
            id="priceLevel"
            value={priceLevel}
            onChange={(e) => setPriceLevel(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">--</option>
            {BUDGET_LEVELS.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Rating value={rating} onChange={setRating} label="Rating" error={errors.rating} />

      <ImageUpload
        value={photoUrl}
        onChange={setPhotoUrl}
        folder="venues"
        label="Photo (optional)"
      />

      <Input
        id="location"
        label="Location (optional)"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Bairro Alto, Lisbon"
      />

      <div className="flex items-center gap-3">
        <input
          id="wouldReturn"
          type="checkbox"
          checked={wouldReturn === true}
          onChange={(e) => setWouldReturn(e.target.checked ? true : null)}
          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
        />
        <label htmlFor="wouldReturn" className="text-sm font-medium text-foreground">
          Would go again?
        </label>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="note" className="block text-sm font-medium text-foreground">
          Note (optional)
        </label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={5000}
          placeholder="What to order, the vibe, who you went with..."
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : isEditing ? "Update" : "Add Place"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push("/places")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
