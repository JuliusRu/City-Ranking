"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { CESIUM_BASE_URL } from "@/lib/cesium-config";
import { GLOBE } from "@/config/constants";
import { ratingToColor } from "@/lib/rating";
import type { GlobeMarker } from "@/types";

// Load Cesium widget CSS
import "cesium/Build/Cesium/Widgets/widgets.css";

interface GlobeViewerProps {
  markers?: GlobeMarker[];
  onMarkerClick: (marker: GlobeMarker) => void;
  flyToTarget?: { longitude: number; latitude: number } | null;
}

export function GlobeViewer({
  markers = [],
  onMarkerClick,
  flyToTarget,
}: GlobeViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<unknown>(null);
  const cesiumRef = useRef<typeof import("cesium") | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cesiumReady, setCesiumReady] = useState(false);

  const flyTo = useCallback(
    (longitude: number, latitude: number) => {
      const Cesium = cesiumRef.current;
      const viewer = viewerRef.current as InstanceType<
        typeof import("cesium").Viewer
      > | null;
      if (!Cesium || !viewer) return;

      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          longitude,
          latitude,
          GLOBE.FLY_TO_ALTITUDE
        ),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(GLOBE.FLY_TO_PITCH),
          roll: 0,
        },
        duration: GLOBE.FLY_TO_DURATION,
        easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
      });
    },
    []
  );

  useEffect(() => {
    if (!containerRef.current) return;

    let viewer: InstanceType<typeof import("cesium").Viewer> | null = null;

    async function initCesium() {
      try {
        const Cesium = await import("cesium");
        cesiumRef.current = Cesium;

        // Set base URL for Cesium assets
        (window as unknown as Record<string, unknown>).CESIUM_BASE_URL =
          CESIUM_BASE_URL;

        if (!containerRef.current) return;

        viewer = new Cesium.Viewer(containerRef.current, {
          baseLayerPicker: false,
          geocoder: false,
          homeButton: false,
          sceneModePicker: false,
          selectionIndicator: false,
          timeline: false,
          animation: false,
          fullscreenButton: false,
          vrButton: false,
          navigationHelpButton: false,
          infoBox: false,
          creditContainer: document.createElement("div"),
          baseLayer: new Cesium.ImageryLayer(
            new Cesium.OpenStreetMapImageryProvider({
              url: "https://tile.openstreetmap.org/",
            })
          ),
        });

        // Darker globe atmosphere
        viewer.scene.globe.enableLighting = false;
        viewer.scene.backgroundColor =
          Cesium.Color.fromCssColorString("#0a0a1a");
        viewer.scene.globe.baseColor =
          Cesium.Color.fromCssColorString("#1a1a2e");

        viewerRef.current = viewer;
        setCesiumReady(true);

        // Force resize to fill container
        viewer.resize();

        // Click handler
        const handler = new Cesium.ScreenSpaceEventHandler(
          viewer.scene.canvas
        );
        handler.setInputAction(
          (event: { position: import("cesium").Cartesian2 }) => {
            const picked = viewer!.scene.pick(event.position);
            if (Cesium.defined(picked) && picked.id?.properties) {
              const props = picked.id.properties;
              const marker: GlobeMarker = {
                id: props.id?.getValue(),
                cityId: props.cityId?.getValue(),
                cityName: props.cityName?.getValue(),
                country: props.country?.getValue(),
                latitude: props.latitude?.getValue(),
                longitude: props.longitude?.getValue(),
                rating: props.rating?.getValue(),
                startDate: props.startDate?.getValue(),
                endDate: props.endDate?.getValue() ?? null,
                comment: props.comment?.getValue(),
              };
              onMarkerClick(marker);
            }
          },
          Cesium.ScreenSpaceEventType.LEFT_CLICK
        );

        // Handle window resize
        function handleResize() {
          if (viewer && !viewer.isDestroyed()) {
            viewer.resize();
          }
        }
        window.addEventListener("resize", handleResize);

        // Store cleanup for resize listener
        (viewer as unknown as Record<string, unknown>)._resizeCleanup =
          handleResize;
      } catch (err) {
        console.error("Failed to initialize Cesium:", err);
        setError(
          "Could not load the 3D globe. Please refresh the page or try a different browser."
        );
      }
    }

    initCesium();

    return () => {
      if (viewer && !viewer.isDestroyed()) {
        const cleanup = (viewer as unknown as Record<string, unknown>)
          ._resizeCleanup as (() => void) | undefined;
        if (cleanup) window.removeEventListener("resize", cleanup);
        viewer.destroy();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers when they change
  useEffect(() => {
    const Cesium = cesiumRef.current;
    const viewer = viewerRef.current as InstanceType<
      typeof import("cesium").Viewer
    > | null;
    if (!Cesium || !viewer) return;

    // Remove existing entities
    viewer.entities.removeAll();

    // Add markers
    for (const marker of markers) {
      const color = Cesium.Color.fromCssColorString(
        ratingToColor(marker.rating)
      );

      viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(
          marker.longitude,
          marker.latitude
        ),
        point: {
          pixelSize: GLOBE.MARKER_SIZE,
          color,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: marker.cityName,
          font: "14px sans-serif",
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 2,
          outlineColor: Cesium.Color.BLACK,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -16),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
            GLOBE.LABEL_NEAR_DISTANCE,
            GLOBE.LABEL_FAR_DISTANCE
          ),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        properties: {
          id: marker.id,
          cityId: marker.cityId,
          cityName: marker.cityName,
          country: marker.country,
          latitude: marker.latitude,
          longitude: marker.longitude,
          rating: marker.rating,
          startDate: marker.startDate,
          endDate: marker.endDate,
          comment: marker.comment,
        },
      });
    }
  }, [markers, cesiumReady]);

  // Fly to target when it changes
  useEffect(() => {
    if (flyToTarget) {
      flyTo(flyToTarget.longitude, flyToTarget.latitude);
    }
  }, [flyToTarget, flyTo]);

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#0a0a1a]">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-destructive"
              />
              <path
                d="M12 8v4m0 4h.01"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="text-destructive"
              />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Refresh page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
    />
  );
}
