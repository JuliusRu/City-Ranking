export interface NominatimResult {
  place_id: number;
  osm_id: number;
  osm_type: string;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
  // Present only with extratags=1. OSM stores population as a free-text string
  // (usually plain digits) so it's optional and must be parsed defensively.
  extratags?: { population?: string } & Record<string, string>;
  type: string;
  importance: number;
}

export interface GeocodingResult {
  name: string;
  country: string;
  state?: string;
  latitude: number;
  longitude: number;
  displayName: string;
  externalId: string;
  // City-proper population from OSM, or null when untagged. Feeds the
  // million-cities collection stat + badges.
  population: number | null;
}

// Parse OSM's free-text population tag ("13613660", occasionally with stray
// separators) into a positive integer, or null if it isn't a sane number.
function parsePopulation(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = parseInt(raw.replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

export async function searchCities(
  query: string
): Promise<GeocodingResult[]> {
  const url = new URL(`${NOMINATIM_BASE}/search`);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  // extratags carries the OSM population tag — the source of the million-cities stat.
  url.searchParams.set("extratags", "1");
  url.searchParams.set("limit", "8");
  url.searchParams.set(
    "featuretype",
    "city"
  );

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": "CityRankingApp/1.0",
      "Accept-Language": "en",
    },
  });

  if (!res.ok) {
    throw new Error(`Nominatim API error: ${res.status}`);
  }

  const results: NominatimResult[] = await res.json();

  return results.map((r) => ({
    name: r.address.city || r.address.town || r.address.village || r.display_name.split(",")[0],
    country: r.address.country || "",
    state: r.address.state,
    latitude: parseFloat(r.lat),
    longitude: parseFloat(r.lon),
    displayName: r.display_name,
    externalId: `${r.osm_type}/${r.osm_id}`,
    population: parsePopulation(r.extratags?.population),
  }));
}

export interface DistrictGeocodingResult {
  name: string;
  latitude: number;
  longitude: number;
  displayName: string;
  externalId: string;
}

// Nominatim result fields present with format=jsonv2 that help identify a
// district-level place (vs the city itself or a single street/POI).
interface NominatimDistrictResult extends NominatimResult {
  name?: string;
  addresstype?: string;
  category?: string;
  address: NominatimResult["address"] & {
    suburb?: string;
    neighbourhood?: string;
    city_district?: string;
    borough?: string;
    quarter?: string;
  };
}

// OSM place types that read as a "district/neighbourhood" — used to keep only
// area-level results and drop streets, shops, etc.
const DISTRICT_ADDRESSTYPES = new Set([
  "suburb",
  "neighbourhood",
  "city_district",
  "borough",
  "quarter",
  "district",
  "residential",
]);

// Search for districts/neighbourhoods, spatially constrained to a city by
// biasing Nominatim with a bounded viewbox around the city's coordinates. Keeps
// only area-level hits so the picker isn't polluted with streets or POIs.
export async function searchDistricts(
  query: string,
  city: { latitude: number; longitude: number }
): Promise<DistrictGeocodingResult[]> {
  // ~0.25° box (~25–30 km) around the city centre covers a metro area.
  const d = 0.25;
  const viewbox = [
    city.longitude - d,
    city.latitude + d,
    city.longitude + d,
    city.latitude - d,
  ].join(",");

  const url = new URL(`${NOMINATIM_BASE}/search`);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "10");
  url.searchParams.set("viewbox", viewbox);
  url.searchParams.set("bounded", "1");

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": "CityRankingApp/1.0",
      "Accept-Language": "en",
    },
  });

  if (!res.ok) {
    throw new Error(`Nominatim API error: ${res.status}`);
  }

  const results: NominatimDistrictResult[] = await res.json();

  return results
    .filter(
      (r) =>
        (r.addresstype && DISTRICT_ADDRESSTYPES.has(r.addresstype)) ||
        r.category === "boundary"
    )
    .map((r) => ({
      name:
        r.name ||
        r.address.suburb ||
        r.address.neighbourhood ||
        r.address.city_district ||
        r.address.quarter ||
        r.display_name.split(",")[0],
      latitude: parseFloat(r.lat),
      longitude: parseFloat(r.lon),
      displayName: r.display_name,
      externalId: `${r.osm_type}/${r.osm_id}`,
    }));
}
