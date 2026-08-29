"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CitySearchInput } from "@/components/cities/CitySearchInput";
import { DistrictPicker, type DistrictEntry } from "@/components/districts/DistrictPicker";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Rating } from "@/components/ui/Rating";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { useToast } from "@/components/ui/Toast";
import { TRIP_TYPES, BUDGET_LEVELS, TRANSPORT_METHODS } from "@/config/constants";
import type { GeocodingResult } from "@/lib/geocoding";
import type { VisitWithCity, ParsedVisit } from "@/types";

interface VisitFormProps {
  visit?: VisitWithCity | null;
  // AI-extracted values to seed a fresh form (from the "From text" quick-add).
  prefill?: ParsedVisit | null;
}

export function VisitForm({ visit, prefill }: VisitFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEditing = !!visit;

  const [selectedCity, setSelectedCity] = useState<{
    name: string;
    country: string;
    state?: string;
    latitude: number;
    longitude: number;
    externalId?: string;
    population?: number | null;
  } | null>(
    visit
      ? {
          name: visit.city.name,
          country: visit.city.country,
          state: visit.city.state ?? undefined,
          latitude: visit.city.latitude,
          longitude: visit.city.longitude,
        }
      : prefill?.city
      ? {
          name: prefill.city.name,
          country: prefill.city.country,
          state: prefill.city.state,
          latitude: prefill.city.latitude,
          longitude: prefill.city.longitude,
          externalId: prefill.city.externalId,
          population: prefill.city.population,
        }
      : null
  );
  const [cityId, setCityId] = useState(visit?.cityId ?? "");
  const [rating, setRating] = useState(visit?.rating ?? prefill?.rating ?? 50);
  const [startDate, setStartDate] = useState(
    visit
      ? new Date(visit.startDate).toISOString().split("T")[0]
      : prefill?.startDate ?? ""
  );
  const [endDate, setEndDate] = useState(
    visit?.endDate
      ? new Date(visit.endDate).toISOString().split("T")[0]
      : prefill?.endDate ?? ""
  );
  const [comment, setComment] = useState(visit?.comment ?? prefill?.comment ?? "");
  const [tripType, setTripType] = useState(visit?.tripType ?? prefill?.tripType ?? "");
  const [budgetLevel, setBudgetLevel] = useState(
    visit?.budgetLevel ?? prefill?.budgetLevel ?? ""
  );
  const [transport, setTransport] = useState(
    visit?.transport ?? prefill?.transport ?? ""
  );
  const [wouldReturn, setWouldReturn] = useState(
    visit?.wouldReturn ?? prefill?.wouldReturn ?? null
  );
  const [highlights, setHighlights] = useState(visit?.highlights ?? "");
  const [photoUrl, setPhotoUrl] = useState<string | null>(visit?.photoUrl ?? null);
  // Per-visit privacy. Only matters when the profile is public; default PUBLIC.
  const [isPrivate, setIsPrivate] = useState(visit?.visibility === "PRIVATE");
  const [districts, setDistricts] = useState<DistrictEntry[]>(
    visit?.districts?.map((d) => ({
      name: d.district.name,
      latitude: d.district.latitude,
      longitude: d.district.longitude,
      externalId: d.district.externalId,
      rating: d.rating,
      frequency: d.frequency,
    })) ?? []
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCitySelect(city: GeocodingResult | null) {
    if (!city) {
      setSelectedCity(null);
      setCityId("");
      return;
    }

    setSelectedCity({
      name: city.name,
      country: city.country,
      state: city.state,
      latitude: city.latitude,
      longitude: city.longitude,
      externalId: city.externalId,
      population: city.population,
    });

    try {
      const res = await fetch("/api/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: city.name,
          country: city.country,
          state: city.state,
          latitude: city.latitude,
          longitude: city.longitude,
          externalId: city.externalId,
          population: city.population ?? undefined,
        }),
      });

      const data = await res.json();

      // The endpoint is find-or-create: 200 for a city we already had, 201 for a
      // new one. Either way it returns the row this visit should hang off.
      if (data.success) {
        setCityId(data.data.id);
      } else {
        setErrors({ city: data.error || "Could not save city. Please try again." });
      }
    } catch {
      setErrors({ city: "Could not save city. Please try again." });
    }
  }

  // When seeded from the AI quick-add, the city is geocoded but has no id yet —
  // resolve it once on mount (same create-or-find flow as picking a city).
  useEffect(() => {
    if (prefill?.city && !cityId && !isEditing) {
      handleCitySelect({
        ...prefill.city,
        population: prefill.city.population ?? null,
        displayName: prefill.city.name,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!cityId && !isEditing) newErrors.city = "Please select a city";
    if (!startDate) newErrors.startDate = "Please select a start date";
    if (endDate && startDate && endDate < startDate) {
      newErrors.endDate = "End date must be on or after start date";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const url = isEditing ? `/api/visits/${visit.id}` : "/api/visits";
      const method = isEditing ? "PUT" : "POST";

      const payload: Record<string, unknown> = {
        rating,
        comment: comment || null,
        startDate,
        endDate: endDate || null,
        tripType: tripType || null,
        budgetLevel: budgetLevel || null,
        transport: transport || null,
        wouldReturn,
        highlights: highlights || null,
        photoUrl,
        visibility: isPrivate ? "PRIVATE" : "PUBLIC",
        // Always sent (incl. empty) so edits persist removals — the API replaces
        // the visit's full district set with this list.
        districts: districts.map((d) => ({
          name: d.name,
          latitude: d.latitude,
          longitude: d.longitude,
          externalId: d.externalId ?? null,
          rating: d.rating,
          frequency: d.frequency,
        })),
      };

      if (!isEditing) {
        payload.cityId = cityId;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        const cityName = isEditing
          ? visit.city.name
          : selectedCity?.name ?? "City";
        toast(
          isEditing
            ? `${cityName} visit updated`
            : `${cityName} added to your visits!`,
          "success"
        );
        router.push("/visits");
        router.refresh();
      } else {
        if (data.issues) {
          // Only a few fields render their own error. Anything else would
          // vanish silently (the form just sat there), so surface unmapped
          // issues in the form-level banner instead.
          const rendered = new Set(["city", "rating", "startDate", "endDate"]);
          const fieldErrors: Record<string, string> = {};
          const unmapped: string[] = [];
          for (const issue of data.issues) {
            const field = issue.path === "cityId" ? "city" : issue.path;
            fieldErrors[field] = issue.message;
            if (!rendered.has(field)) {
              unmapped.push(`${issue.path || "form"}: ${issue.message}`);
            }
          }
          if (unmapped.length > 0) {
            fieldErrors.form = `Could not save visit — ${unmapped.join("; ")}`;
          }
          setErrors(fieldErrors);
        } else {
          setErrors({ form: data.error || "Something went wrong" });
        }
      }
    } catch {
      setErrors({ form: "Could not save visit. Check your connection and try again." });
    } finally {
      setIsSubmitting(false);
    }
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.form && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {errors.form}
        </div>
      )}

      {!isEditing && (
        <CitySearchInput
          onSelect={handleCitySelect}
          selectedCity={selectedCity}
          error={errors.city}
        />
      )}

      {isEditing && (
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">
            City
          </label>
          <p className="text-sm text-muted-foreground">
            {visit.city.name}, {visit.city.country}
          </p>
        </div>
      )}

      <Rating
        value={rating}
        onChange={setRating}
        label="Rating"
        error={errors.rating}
      />

      <DistrictPicker
        city={
          selectedCity
            ? { latitude: selectedCity.latitude, longitude: selectedCity.longitude }
            : null
        }
        value={districts}
        onChange={setDistricts}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          id="startDate"
          type="date"
          label="Start Date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          error={errors.startDate}
          max={today}
        />
        <Input
          id="endDate"
          type="date"
          label="End Date (optional)"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          error={errors.endDate}
          min={startDate || undefined}
          max={today}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label htmlFor="tripType" className="block text-sm font-medium text-foreground">
            Trip Type
          </label>
          <select
            id="tripType"
            value={tripType}
            onChange={(e) => setTripType(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">--</option>
            {TRIP_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="budgetLevel" className="block text-sm font-medium text-foreground">
            Budget
          </label>
          <select
            id="budgetLevel"
            value={budgetLevel}
            onChange={(e) => setBudgetLevel(e.target.value)}
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
        <div className="space-y-1.5">
          <label htmlFor="transport" className="block text-sm font-medium text-foreground">
            Transport
          </label>
          <select
            id="transport"
            value={transport}
            onChange={(e) => setTransport(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">--</option>
            {TRANSPORT_METHODS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          id="wouldReturn"
          type="checkbox"
          checked={wouldReturn === true}
          onChange={(e) => setWouldReturn(e.target.checked ? true : null)}
          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
        />
        <label htmlFor="wouldReturn" className="text-sm font-medium text-foreground">
          Would visit again?
        </label>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="highlights"
          className="block text-sm font-medium text-foreground"
        >
          Highlights (optional)
        </label>
        <textarea
          id="highlights"
          value={highlights}
          onChange={(e) => setHighlights(e.target.value)}
          rows={2}
          maxLength={5000}
          placeholder="Key sights, foods, activities..."
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="comment"
          className="block text-sm font-medium text-foreground"
        >
          Comment (optional)
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          maxLength={5000}
          placeholder="Share your experience..."
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          aria-describedby="comment-counter"
        />
        <p id="comment-counter" className="text-xs text-muted-foreground">
          {comment.length}/5000 characters
        </p>
      </div>

      <ImageUpload
        value={photoUrl}
        onChange={setPhotoUrl}
        folder="visits"
        label="Photo (optional)"
      />

      {/* Per-visit privacy: hide a single trip even on a public profile. */}
      <label className="flex items-start gap-3 rounded-lg border border-border bg-background p-3">
        <input
          type="checkbox"
          checked={isPrivate}
          onChange={(e) => setIsPrivate(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
        />
        <span>
          <span className="block text-sm font-medium text-foreground">
            Keep this trip private
          </span>
          <span className="block text-xs text-muted-foreground">
            Only you can see it — it stays off your public profile, the feed and
            community ratings. (Your profile-wide setting still applies too.)
          </span>
        </span>
      </label>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && (
            <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
          )}
          {isSubmitting
            ? "Saving..."
            : isEditing
              ? "Update Visit"
              : "Add Visit"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/visits")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
