/**
 * DESIGN: Liquid Glass — 3D Terrain Map Visualization
 * MapLibre GL JS with 3D terrain, hillshading, US States GeoJSON choropleth, click-to-filter.
 * Uses CARTO dark tiles + MapTiler terrain for 3D depth.
 */

import { useApp } from "@/contexts/AppContext";
import { STATE_NAMES } from "@/lib/types";
import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const GEOJSON_URL = "https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json";

const STATE_ABBREV: Record<string, string> = {};
for (const [abbr, name] of Object.entries(STATE_NAMES)) {
  STATE_ABBREV[name] = abbr;
}

function getSentimentColor(data: { positive: number; neutral: number; negative: number; total: number } | undefined): string {
  if (!data || data.total === 0) return "rgba(100, 180, 255, 0.08)";
  const posRatio = data.positive / data.total;
  const negRatio = data.negative / data.total;
  if (posRatio > 0.5) {
    const intensity = 0.15 + posRatio * 0.35;
    return `rgba(52, 211, 153, ${intensity})`;
  }
  if (negRatio > 0.5) {
    const intensity = 0.15 + negRatio * 0.35;
    return `rgba(248, 113, 113, ${intensity})`;
  }
  const intensity = 0.15 + (data.neutral / data.total) * 0.3;
  return `rgba(251, 191, 36, ${intensity})`;
}

export default function USAMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const { stateSentiment, selectedState, setSelectedState } = useApp();
  const selectedStateRef = useRef(selectedState);
  selectedStateRef.current = selectedState;
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          "dark-matter": {
            type: "raster",
            tiles: [
              "https://basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png",
            ],
            tileSize: 256,
            attribution: "&copy; CARTO &copy; OpenStreetMap contributors",
            maxzoom: 19,
          },
        },
        layers: [
          {
            id: "background",
            type: "background",
            paint: { "background-color": "#060910" },
          },
          {
            id: "dark-base",
            type: "raster",
            source: "dark-matter",
            paint: {
              "raster-opacity": 0.5,
              "raster-brightness-max": 0.5,
              "raster-contrast": 0.3,
              "raster-saturation": -0.6,
            },
          },
        ],
        glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
      },
      center: [-97.5, 38.5],
      zoom: 4.0,
      pitch: 40,
      bearing: -8,
      minZoom: 2,
      maxZoom: 10,
      maxPitch: 60,
      attributionControl: false,
    });

    map.on("load", async () => {
      try {
        // Try to add 3D terrain from a free DEM source
        try {
          map.addSource("terrainSource", {
            type: "raster-dem",
            tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
            tileSize: 256,
            maxzoom: 14,
            encoding: "terrarium",
          });

          map.addSource("hillshadeSource", {
            type: "raster-dem",
            tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
            tileSize: 256,
            maxzoom: 14,
            encoding: "terrarium",
          });

          // Add hillshade layer for depth
          map.addLayer({
            id: "hillshade",
            type: "hillshade",
            source: "hillshadeSource",
            paint: {
              "hillshade-shadow-color": "#0a0e1a",
              "hillshade-highlight-color": "rgba(140, 180, 220, 0.12)",
              "hillshade-accent-color": "rgba(80, 120, 180, 0.08)",
              "hillshade-exaggeration": 0.35,
              "hillshade-illumination-direction": 315,
            },
          });

          // Enable 3D terrain
          map.setTerrain({ source: "terrainSource", exaggeration: 1.8 });
          console.log("[Map] 3D terrain enabled");
        } catch (terrainErr) {
          console.warn("[Map] 3D terrain unavailable, continuing with 2D:", terrainErr);
        }

        // Load US states GeoJSON
        const res = await fetch(GEOJSON_URL);
        const geojson = await res.json();

        map.addSource("us-states", {
          type: "geojson",
          data: geojson,
        });

        // State fill — soft translucent blue
        map.addLayer({
          id: "state-fills",
          type: "fill",
          source: "us-states",
          paint: {
            "fill-color": "rgba(100, 180, 255, 0.08)",
            "fill-opacity": 1,
          },
        });

        // State borders — glowing lines
        map.addLayer({
          id: "state-borders",
          type: "line",
          source: "us-states",
          paint: {
            "line-color": "rgba(120, 180, 255, 0.22)",
            "line-width": [
              "interpolate", ["linear"], ["zoom"],
              3, 0.6,
              6, 1.2,
              8, 1.8,
            ],
          },
        });

        // Outer glow border for depth
        map.addLayer({
          id: "state-borders-glow",
          type: "line",
          source: "us-states",
          paint: {
            "line-color": "rgba(80, 150, 255, 0.06)",
            "line-width": [
              "interpolate", ["linear"], ["zoom"],
              3, 3,
              6, 5,
              8, 7,
            ],
            "line-blur": 4,
          },
        });

        // Hover highlight
        map.addLayer({
          id: "state-hover",
          type: "fill",
          source: "us-states",
          paint: {
            "fill-color": "rgba(100, 200, 255, 0.15)",
            "fill-opacity": 0,
          },
        });

        // Hover border glow
        map.addLayer({
          id: "state-hover-border",
          type: "line",
          source: "us-states",
          paint: {
            "line-color": "rgba(100, 200, 255, 0.5)",
            "line-width": 2,
            "line-opacity": 0,
          },
        });

        // Selected state highlight
        map.addLayer({
          id: "state-selected",
          type: "line",
          source: "us-states",
          paint: {
            "line-color": "rgba(0, 220, 255, 0.8)",
            "line-width": 2.5,
          },
          filter: ["==", "name", ""],
        });

        // Selected state fill
        map.addLayer({
          id: "state-selected-fill",
          type: "fill",
          source: "us-states",
          paint: {
            "fill-color": "rgba(0, 200, 255, 0.12)",
            "fill-opacity": 1,
          },
          filter: ["==", "name", ""],
        });

        // Selected state outer glow
        map.addLayer({
          id: "state-selected-glow",
          type: "line",
          source: "us-states",
          paint: {
            "line-color": "rgba(0, 200, 255, 0.25)",
            "line-width": 6,
            "line-blur": 5,
          },
          filter: ["==", "name", ""],
        });

        setMapLoaded(true);
      } catch (err) {
        console.error("Failed to load GeoJSON:", err);
      }
    });

    let hoveredStateName = "";

    map.on("mousemove", "state-fills", (e) => {
      if (!e.features?.[0]) return;
      const name = e.features[0].properties?.name || "";
      if (name === hoveredStateName) return;
      hoveredStateName = name;

      map.getCanvas().style.cursor = "pointer";
      map.setPaintProperty("state-hover", "fill-opacity", [
        "case",
        ["==", ["get", "name"], name],
        1,
        0,
      ]);
      map.setPaintProperty("state-hover-border", "line-opacity", [
        "case",
        ["==", ["get", "name"], name],
        1,
        0,
      ]);

      const abbr = STATE_ABBREV[name] || "";
      if (popupRef.current) popupRef.current.remove();
      popupRef.current = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: "state-tooltip",
        offset: 12,
      })
        .setLngLat(e.lngLat)
        .setHTML(`
          <div style="
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            color: rgba(200, 230, 255, 0.9);
            padding: 6px 14px;
            background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.03));
            border: 1px solid rgba(255,255,255,0.15);
            border-radius: 10px;
            backdrop-filter: blur(24px);
            box-shadow: 0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08);
            letter-spacing: 0.03em;
          ">
            <strong style="color: rgba(100, 210, 255, 0.95);">${name}</strong>
            ${abbr ? `<span style="opacity: 0.5; margin-left: 6px;">${abbr}</span>` : ""}
          </div>
        `)
        .addTo(map);
    });

    map.on("mouseleave", "state-fills", () => {
      hoveredStateName = "";
      map.getCanvas().style.cursor = "";
      map.setPaintProperty("state-hover", "fill-opacity", 0);
      map.setPaintProperty("state-hover-border", "line-opacity", 0);
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
    });

    map.on("click", "state-fills", (e) => {
      if (!e.features?.[0]) return;
      const name = e.features[0].properties?.name || "";
      const abbr = STATE_ABBREV[name] || "";
      if (abbr) {
        setSelectedState(selectedStateRef.current === abbr ? null : abbr);
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update choropleth colors
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;

    if (Object.keys(stateSentiment).length === 0) {
      map.setPaintProperty("state-fills", "fill-color", "rgba(100, 180, 255, 0.08)");
      return;
    }

    const matchExpr: any[] = ["match", ["get", "name"]];
    for (const [name, abbr] of Object.entries(STATE_ABBREV)) {
      const data = stateSentiment[abbr];
      if (data) {
        matchExpr.push(name, getSentimentColor(data));
      }
    }
    matchExpr.push("rgba(100, 180, 255, 0.08)");

    map.setPaintProperty("state-fills", "fill-color", matchExpr);
  }, [stateSentiment, mapLoaded]);

  // Update selected state highlight
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;

    if (selectedState) {
      const name = STATE_NAMES[selectedState] || "";
      map.setFilter("state-selected", ["==", "name", name]);
      map.setFilter("state-selected-fill", ["==", "name", name]);
      map.setFilter("state-selected-glow", ["==", "name", name]);
    } else {
      map.setFilter("state-selected", ["==", "name", ""]);
      map.setFilter("state-selected-fill", ["==", "name", ""]);
      map.setFilter("state-selected-glow", ["==", "name", ""]);
    }
  }, [selectedState, mapLoaded]);

  return (
    <>
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
      {/* Atmospheric vignette overlay for cinematic depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 50% 35%, transparent 35%, rgba(6, 9, 16, 0.35) 80%, rgba(6, 9, 16, 0.7) 100%),
            linear-gradient(to bottom, rgba(6, 9, 16, 0.2) 0%, transparent 15%, transparent 85%, rgba(6, 9, 16, 0.3) 100%)
          `,
        }}
      />
      {/* Subtle top-edge light leak for 3D atmosphere */}
      <div
        className="absolute inset-x-0 top-0 h-32 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, rgba(80, 140, 220, 0.03) 0%, transparent 100%)",
        }}
      />
    </>
  );
}
