"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CitySearchInput } from "@/components/cities/CitySearchInput";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Rating } from "@/components/ui/Rating";
import { useToast } from "@/components/ui/Toast";
import { TRIP_TYPES, BUDGET_LEVELS, TRANSPORT_METHODS } from "@/config/constants";
import type { GeocodingResult } from "@/lib/geocoding";
import type { VisitWithCity } from "@/types";

interface VisitFormProps {
  visit?: VisitWithCity | null;
}

export function VisitForm({ visit }: VisitFormProps) {
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
  } | null>(
    visit
      ? {
          name: visit.city.name,
          country: visit.city.country,
          state: visit.city.state ?? undefined,
          latitude: visit.city.latitude,
          longitude: visit.city.longitude,
        }
      : null
  );
  const [cityId, setCityId] = useState(visit?.cityId ?? "");
  const [rating, setRating] = useState(visit?.rating ?? 50);
  const [startDate, setStartDate] = useState(
    visit ? new Date(visit.startDate).toISOString().split("T")[0] : ""
  );
  const [endDate, setEndDate] = useState(
    visit?.endDate
      ? new Date(visit.endDate).toISOString().split("T")[0]
      : ""
  );
  const [comment, setComment] = useState(visit?.comment ?? "");
  const [tripType, setTripType] = useState(visit?.tripType ?? "");
  const [budgetLevel, setBudgetLevel] = useState(visit?.budgetLevel ?? "");
  const [transport, setTransport] = useState(visit?.transport ?? "");
  const [wouldReturn, setWouldReturn] = useState(visit?.wouldReturn ?? null);
  const [highlights, setHighlights] = useState(visit?.highlights ?? "");
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
        }),
      });

      const data = await res.json();

      if (data.success) {
        setCityId(data.data.id);
      } else if (res.status === 409) {
        // City already exists — fetch it
        const searchRes = await fetch("/api/cities");
        const searchData = await searchRes.json();
        if (searchData.success) {
          const existing = searchData.data.find(
            (c: { name: string; country: string }) =>
              c.name === city.name && c.country === city.country
          );
          if (existing) setCityId(existing.id);
        }
      }
    } catch {
      setErrors({ city: "Could not save city. Please try again." });
    }
  }

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
          const fieldErrors: Record<string, string> = {};
          for (const issue of data.issues) {
            fieldErrors[issue.path] = issue.message;
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

      <div className="grid grid-cols-2 gap-4">
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

      <div className="grid grid-cols-3 gap-4">
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
