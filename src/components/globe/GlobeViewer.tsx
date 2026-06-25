"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { GLOBE } from "@/config/constants";
import { ratingToColor } from "@/lib/rating";
import type { GlobeMarker } from "@/types";

const SRC = "cr-cities";
const DOTS = "cr-dots";
const LABELS = "cr-labels";
const DEM = "cr-dem";
const HILLSHADE = "cr-hillshade";

// Free, no-key CARTO vector styles — a dark and a light variant so the globe
// follows the app's light/dark theme. Swap for OpenFreeMap/MapTiler here.
type ThemeStyle = {
  style: string;
  bg: string;
  sky: maplibregl.SkySpecification;
  text: string;
  halo: string;
  hillShadow: string;
  hillHighlight: string;
};
const DARK: ThemeStyle = {
  style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  bg: "#06060c",
  sky: {
    "sky-color": "#0a0a16",
    "sky-horizon-blend": 0.6,
    "horizon-color": "#16233f",
    "horizon-fog-blend": 0.6,
    "fog-color": "#0a0a16",
    "fog-ground-blend": 0.4,
    "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 0, 0.9, 6, 0.6, 9, 0],
  },
  text: "#ffffff",
  halo: "rgba(0,0,0,0.9)",
  hillShadow: "#000000",
  hillHighlight: "#33486b",
};
const LIGHT: ThemeStyle = {
  style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  bg: "#dde6ef",
  sky: {
    "sky-color": "#bcd3ec",
    "sky-horizon-blend": 0.6,
    "horizon-color": "#d6e2ee",
    "horizon-fog-blend": 0.6,
    "fog-color": "#dde6ef",
    "fog-ground-blend": 0.4,
    "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 0, 0.8, 6, 0.5, 9, 0],
  },
  text: "#1f2937",
  halo: "rgba(255,255,255,0.9)",
  hillShadow: "#5b6b7a",
  hillHighlight: "#ffffff",
};

function isDark(): boolean {
  return (
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark")
  );
}

interface GlobeViewerProps {
  markers?: GlobeMarker[];
  onMarkerClick: (marker: GlobeMarker) => void;
  flyToTarget?: { longitude: number; latitude: number; key: number } | null;
}

// Markers as a GeoJSON source → GPU layers, which follow the globe projection
// exactly (HTML markers drift on the sphere at low zoom).
function toFeatureCollection(markers: GlobeMarker[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: markers.map((m) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [m.longitude, m.latitude] },
      properties: {
        id: m.id,
        cityId: m.cityId,
        cityName: m.cityName,
        country: m.country,
        latitude: m.latitude,
        longitude: m.longitude,
        rating: m.rating,
        startDate: m.startDate,
        endDate: m.endDate ?? "",
        comment: m.comment ?? "",
        color: ratingToColor(m.rating),
      },
    })),
  };
}

export function GlobeViewer({
  markers = [],
  onMarkerClick,
  flyToTarget,
}: GlobeViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const clickRef = useRef(onMarkerClick);
  clickRef.current = onMarkerClick;
  const markersRef = useRef<GlobeMarker[]>(markers);
  markersRef.current = markers;
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Apply projection, atmosphere, source + layers for the given theme. Re-runs
  // after a theme switch (setStyle wipes custom sources/layers).
  function decorate(map: maplibregl.Map, t: ThemeStyle) {
    map.setProjection({ type: "globe" });
    map.setSky(t.sky);

    // Terrain relief: a free DEM (AWS terrain tiles, terrarium-encoded) rendered
    // as hillshade so mountains get visible shading. Added before the markers so
    // the city dots/labels stay on top.
    if (!map.getSource(DEM)) {
      map.addSource(DEM, {
        type: "raster-dem",
        tiles: [
          "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
        ],
        encoding: "terrarium",
        tileSize: 256,
        maxzoom: 13,
        attribution: "Terrain: Mapzen / AWS Open Data",
      });
    }
    if (!map.getLayer(HILLSHADE)) {
      map.addLayer({
        id: HILLSHADE,
        type: "hillshade",
        source: DEM,
        paint: {
          "hillshade-exaggeration": 0.7,
          "hillshade-shadow-color": t.hillShadow,
          "hillshade-highlight-color": t.hillHighlight,
        },
      });
    }

    if (!map.getSource(SRC)) {
      map.addSource(SRC, { type: "geojson", data: toFeatureCollection([]) });
    }
    if (!map.getLayer(DOTS)) {
      map.addLayer({
        id: DOTS,
        type: "circle",
        source: SRC,
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 1, 4, 4, 7, 8, 10],
          "circle-color": ["get", "color"],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
        },
      });
    }
    if (!map.getLayer(LABELS)) {
      map.addLayer({
        id: LABELS,
        type: "symbol",
        source: SRC,
        layout: {
          "text-field": ["get", "cityName"],
          "text-font": ["Open Sans Semibold"],
          "text-size": 12,
          "text-offset": [0, 1.1],
          "text-anchor": "top",
        },
        paint: {
          "text-color": t.text,
          "text-halo-color": t.halo,
          "text-halo-width": 1.5,
        },
      });
    }
    (map.getSource(SRC) as maplibregl.GeoJSONSource).setData(
      toFeatureCollection(markersRef.current)
    );
  }

  // Init map once.
  useEffect(() => {
    if (!containerRef.current) return;
    let theme = isDark() ? DARK : LIGHT;
    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: theme.style,
        center: [10, 25],
        zoom: 1.4,
        attributionControl: { compact: true },
      });
    } catch (err) {
      console.error("Failed to init MapLibre:", err);
      setError("Could not load the globe. Please refresh.");
      return;
    }
    mapRef.current = map;
    if (containerRef.current) containerRef.current.style.background = theme.bg;

    map.on("load", () => {
      decorate(map, theme);

      // Click + hover affordances on the dots (added once; survive a setStyle).
      map.on("click", DOTS, (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const p = f.properties as Record<string, unknown>;
        clickRef.current({
          id: String(p.id),
          cityId: String(p.cityId),
          cityName: String(p.cityName),
          country: String(p.country),
          latitude: Number(p.latitude),
          longitude: Number(p.longitude),
          rating: Number(p.rating),
          startDate: String(p.startDate),
          endDate: p.endDate ? String(p.endDate) : null,
          comment: p.comment ? String(p.comment) : null,
        });
      });
      map.on("mouseenter", DOTS, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", DOTS, () => {
        map.getCanvas().style.cursor = "";
      });

      setReady(true);
    });

    map.on("error", (e) => console.warn("MapLibre:", e.error?.message ?? e));

    // Follow the app's light/dark theme — swap the style when <html> class flips.
    const observer = new MutationObserver(() => {
      const nextDark = isDark();
      const nextTheme = nextDark ? DARK : LIGHT;
      if (nextTheme.style === theme.style) return;
      theme = nextTheme;
      if (containerRef.current) containerRef.current.style.background = theme.bg;
      map.setStyle(theme.style);
      map.once("style.load", () => decorate(map, theme));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push marker data whenever it changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const src = map.getSource(SRC) as maplibregl.GeoJSONSource | undefined;
    src?.setData(toFeatureCollection(markers));
  }, [markers, ready]);

  // Fly to a target when it changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !flyToTarget) return;
    map.flyTo({
      center: [flyToTarget.longitude, flyToTarget.latitude],
      zoom: 4.5,
      duration: GLOBE.FLY_TO_DURATION * 1000,
      essential: true,
    });
  }, [flyToTarget, ready]);

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#0a0a16]">
        <div className="max-w-sm text-center">
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-gradient-brand px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Refresh page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />
  );
}
