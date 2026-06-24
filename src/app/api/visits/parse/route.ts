import { NextRequest } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { chatJSON, OpenRouterError } from "@/lib/openrouter";
import { searchCities } from "@/lib/geocoding";
import {
  apiSuccess,
  apiError,
  apiValidationError,
  apiRateLimited,
  apiUnauthorized,
} from "@/lib/api-response";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limiter";
import { parseVisitInputSchema } from "@/lib/validators/parse";
import {
  RATE_LIMITS,
  TRIP_TYPES,
  BUDGET_LEVELS,
  TRANSPORT_METHODS,
  DISTRICT_FREQUENCIES,
} from "@/config/constants";
import type { ParsedVisit, DistrictFrequency } from "@/types";

const TRIP = new Set<string>(TRIP_TYPES.map((t) => t.value));
const BUDGET = new Set<string>(BUDGET_LEVELS.map((b) => b.value));
const TRANSPORT = new Set<string>(TRANSPORT_METHODS.map((t) => t.value));
const FREQ = new Set<string>(DISTRICT_FREQUENCIES.map((f) => f.value));

// Keep only a value that's in the allowed set (lowercased), else null.
function oneOf(set: Set<string>, v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim().toLowerCase();
  return set.has(s) ? s : null;
}

function clampRating(v: unknown): number | null {
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
  if (Number.isNaN(n)) return null;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function isoDate(v: unknown): string | null {
  if (typeof v !== "string") return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(v.trim()) ? v.trim() : null;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  // AI calls cost money — keep this on the tighter create limit.
  const { allowed } = rateLimit(getRateLimitKey(ip, "/api/visits/parse"), RATE_LIMITS.CREATE);
  if (!allowed) return apiRateLimited();

  try {
    const parsed = parseVisitInputSchema.safeParse(await request.json());
    if (!parsed.success) return apiValidationError(parsed.error);

    const userId = await getCurrentUserId();
    if (!userId) return apiUnauthorized();

    const today = new Date().toISOString().slice(0, 10);

    const system = [
      "You extract structured city-visit data from a traveller's free-text note (often dictated by voice).",
      "Return ONLY a JSON object. Every field is optional — use null when the text doesn't clearly state it. Never invent facts.",
      "Fields:",
      "- city: string|null — the main city visited",
      "- country: string|null",
      "- rating: integer 0-100|null — overall impression. Map any scale to 0-100 (e.g. '8/10'->80, '4.5 stars'->90, 'amazing'->92, 'okay'->55, 'awful'->15).",
      `- startDate: 'YYYY-MM-DD'|null — resolve relative dates using today=${today}. If only a month/season/year is given, pick a reasonable date in it.`,
      "- endDate: 'YYYY-MM-DD'|null",
      "- comment: string|null — a concise first-person summary of their impressions, cleaned up grammar but keep their voice",
      "- tripType: one of solo|couple|family|friends|business | null",
      "- budgetLevel: one of budget|moderate|expensive|luxury | null",
      "- transport: one of flew|drove|train|bus|cruise|other | null",
      "- wouldReturn: boolean|null",
      "- districts: array of { name: string, rating: integer 0-100|null, frequency: passed_through|few_times|a_lot|based_here|null } | null — neighbourhoods/districts mentioned",
      "Return JSON only, no prose.",
    ].join("\n");

    let raw: Record<string, unknown>;
    try {
      raw = (await chatJSON({ system, user: parsed.data.text })) as Record<string, unknown>;
    } catch (e) {
      if (e instanceof OpenRouterError) {
        console.error("parse: OpenRouter error:", e.message);
        return apiError(
          "AI extraction is unavailable right now. You can still fill the form manually.",
          502
        );
      }
      throw e;
    }

    // Resolve the city name to real coordinates via the existing geocoder.
    const cityQuery = typeof raw.city === "string" ? raw.city.trim() : null;
    let city: ParsedVisit["city"] = null;
    if (cityQuery) {
      try {
        const country = typeof raw.country === "string" ? raw.country : "";
        const results = await searchCities([cityQuery, country].filter(Boolean).join(", "));
        const best = results[0];
        if (best) {
          city = {
            name: best.name,
            country: best.country,
            state: best.state,
            latitude: best.latitude,
            longitude: best.longitude,
            externalId: best.externalId,
          };
        }
      } catch (e) {
        console.error("parse: geocoding failed:", e);
      }
    }

    // Normalize the district frequency strings to the enum (PASSED_THROUGH, …).
    const FREQ_LOWER_TO_ENUM = new Map(
      DISTRICT_FREQUENCIES.map((f) => [f.value.toLowerCase(), f.value])
    );
    const districts = Array.isArray(raw.districts)
      ? (raw.districts as unknown[])
          .map((d) => {
            if (!d || typeof d !== "object") return null;
            const o = d as Record<string, unknown>;
            const name = typeof o.name === "string" ? o.name.trim() : "";
            if (!name) return null;
            const freqRaw = typeof o.frequency === "string" ? o.frequency.trim().toLowerCase() : "";
            const frequency = (FREQ.has(freqRaw)
              ? freqRaw
              : FREQ_LOWER_TO_ENUM.get(freqRaw) ?? "FEW_TIMES") as DistrictFrequency;
            return { name, rating: clampRating(o.rating) ?? 50, frequency };
          })
          .filter((d): d is { name: string; rating: number; frequency: DistrictFrequency } => d !== null)
          .slice(0, 20)
      : [];

    const result: ParsedVisit = {
      city,
      cityQuery,
      rating: clampRating(raw.rating),
      startDate: isoDate(raw.startDate),
      endDate: isoDate(raw.endDate),
      comment: typeof raw.comment === "string" ? raw.comment.trim() || null : null,
      tripType: oneOf(TRIP, raw.tripType),
      budgetLevel: oneOf(BUDGET, raw.budgetLevel),
      transport: oneOf(TRANSPORT, raw.transport),
      wouldReturn: typeof raw.wouldReturn === "boolean" ? raw.wouldReturn : null,
      districts,
    };

    return apiSuccess(result);
  } catch (error) {
    console.error("POST /api/visits/parse error:", error);
    return apiError("Failed to parse your note");
  }
}
