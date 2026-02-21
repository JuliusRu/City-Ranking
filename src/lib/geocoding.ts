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
}

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

export async function searchCities(
  query: string
): Promise<GeocodingResult[]> {
  const url = new URL(`${NOMINATIM_BASE}/search`);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
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
  }));
}
