import { NextRequest } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { chatJSON, OpenRouterError } from "@/lib/openrouter";
import { searchCities, type GeocodingResult } from "@/lib/geocoding";
import {
  apiSuccess,
  apiError,
  apiValidationError,
  apiRateLimited,
  apiUnauthorized,
} from "@/lib/api-response";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limiter";
import { parseCitiesInputSchema } from "@/lib/validators/onboarding";
import { RATE_LIMITS } from "@/config/constants";

// Geocoded city + the rating (0–100) the user implied, if any. Mirrors the
// minimal city shape the visit form / globe consume.
export interface ParsedCity {
  city: {
    name: string;
    country: string;
    state?: string;
    latitude: number;
    longitude: number;
    externalId: string;
    population: number | null;
  };
  rating: number | null;
}

// Cap how many cities we'll geocode per request — each is a (rate-limited)
// Nominatim round-trip, and the onboarding list shouldn't be hundreds long.
const MAX_CITIES = 12;

function clampRating(v: unknown): number | null {
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
  if (Number.isNaN(n)) return null;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  // AI calls cost money — keep this on the tighter create limit.
  const { allowed } = rateLimit(getRateLimitKey(ip, "/api/cities/parse"), RATE_LIMITS.CREATE);
  if (!allowed) return apiRateLimited();

  try {
    const parsed = parseCitiesInputSchema.safeParse(await request.json());
    if (!parsed.success) return apiValidationError(parsed.error);

    const userId = await getCurrentUserId();
    if (!userId) return apiUnauthorized();

    const system = [
      "You extract a LIST of cities a traveller mentions in a free-text note (often dictated).",
      'Return ONLY a JSON object of the form {"cities": [{"city": string, "country": string|null, "rating": integer 0-100|null}]}.',
      "One entry per distinct city. Never invent cities that aren't mentioned. Keep their order.",
      "rating = their overall impression of that city, mapped to 0-100 (e.g. '8/10'->80, '4.5 stars'->90, 'amazing'->92, 'okay'->55, 'awful'->15). Use null when no opinion is given for that city.",
      "If a rating applies to all cities at once ('all great'), apply it to each.",
      "Return JSON only, no prose.",
    ].join("\n");

    let raw: { cities?: unknown };
    try {
      raw = (await chatJSON({ system, user: parsed.data.text })) as { cities?: unknown };
    } catch (e) {
      if (e instanceof OpenRouterError) {
        console.error("cities/parse: OpenRouter error:", e.message);
        return apiError(
          "AI extraction is unavailable right now. You can still add cities by search.",
          502
        );
      }
      throw e;
    }

    const entries = Array.isArray(raw.cities) ? raw.cities.slice(0, MAX_CITIES) : [];

    // Geocode each named city, sequentially (Nominatim asks for ≤1 req/s and the
    // shared geocoder has no batch endpoint). Dedup by externalId.
    const seen = new Set<string>();
    const out: ParsedCity[] = [];
    for (const e of entries) {
      if (!e || typeof e !== "object") continue;
      const o = e as Record<string, unknown>;
      const name = typeof o.city === "string" ? o.city.trim() : "";
      if (!name) continue;
      const country = typeof o.country === "string" ? o.country.trim() : "";
      let best: GeocodingResult | undefined;
      try {
        const results = await searchCities([name, country].filter(Boolean).join(", "));
        best = results[0];
      } catch (err) {
        console.error("cities/parse: geocoding failed for", name, err);
      }
      if (!best || seen.has(best.externalId)) continue;
      seen.add(best.externalId);
      out.push({
        city: {
          name: best.name,
          country: best.country,
          state: best.state,
          latitude: best.latitude,
          longitude: best.longitude,
          externalId: best.externalId,
          population: best.population,
        },
        rating: clampRating(o.rating),
      });
    }

    return apiSuccess(out);
  } catch (error) {
    console.error("POST /api/cities/parse error:", error);
    return apiError("Failed to read your note");
  }
}
