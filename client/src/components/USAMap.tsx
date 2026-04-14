/**
 * DESIGN: Liquid Glass — Full-Screen Map Visualization
 * MapLibre GL JS with US States GeoJSON, gradient background, soft choropleth, click-to-filter
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
  if (!data || data.total === 0) return "rgba(100, 180, 255, 0.06)";
  const posRatio = data.positive / data.total;
  const negRatio = data.negative / data.total;
  if (posRatio > 0.5) {
    const intensity = 0.12 + posRatio * 0.28;
    return `rgba(52, 211, 153, ${intensity})`;
  }
  if (negRatio > 0.5) {
    const intensity = 0.12 + negRatio * 0.28;
    return `rgba(248, 113, 113, ${intensity})`;
  }
  const intensity = 0.12 + (data.neutral / data.total) * 0.22;
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
        sources: {},
        layers: [
          {
            id: "background",
            type: "background",
            paint: { "background-color": "#080B12" },
          },
        ],
        glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
      },
      center: [-98.5, 39.8],
      zoom: 3.8,
      minZoom: 2,
      maxZoom: 8,
      attributionControl: false,
    });

    map.on("load", async () => {
      try {
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
            "fill-color": "rgba(100, 180, 255, 0.06)",
            "fill-opacity": 1,
          },
        });

        // State borders — soft glowing lines
        map.addLayer({
          id: "state-borders",
          type: "line",
          source: "us-states",
          paint: {
            "line-color": "rgba(120, 180, 255, 0.18)",
            "line-width": 0.8,
          },
        });

        // Hover highlight — brighter fill
        map.addLayer({
          id: "state-hover",
          type: "fill",
          source: "us-states",
          paint: {
            "fill-color": "rgba(100, 200, 255, 0.12)",
            "fill-opacity": 0,
          },
        });

        // Hover border glow
        map.addLayer({
          id: "state-hover-border",
          type: "line",
          source: "us-states",
          paint: {
            "line-color": "rgba(100, 200, 255, 0.4)",
            "line-width": 1.5,
            "line-opacity": 0,
          },
        });

        // Selected state highlight
        map.addLayer({
          id: "state-selected",
          type: "line",
          source: "us-states",
          paint: {
            "line-color": "rgba(0, 200, 255, 0.7)",
            "line-width": 2,
          },
          filter: ["==", "name", ""],
        });

        // Selected state fill
        map.addLayer({
          id: "state-selected-fill",
          type: "fill",
          source: "us-states",
          paint: {
            "fill-color": "rgba(0, 200, 255, 0.08)",
            "fill-opacity": 1,
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
            padding: 6px 12px;
            background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03));
            border: 1px solid rgba(255,255,255,0.12);
            border-radius: 10px;
            backdrop-filter: blur(20px);
            box-shadow: 0 4px 16px rgba(0,0,0,0.3);
            letter-spacing: 0.03em;
          ">
            <strong style="color: rgba(100, 200, 255, 0.9);">${name}</strong>
            ${abbr ? `<span style="opacity: 0.5; margin-left: 4px;">${abbr}</span>` : ""}
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
      map.setPaintProperty("state-fills", "fill-color", "rgba(100, 180, 255, 0.06)");
      return;
    }

    const matchExpr: any[] = ["match", ["get", "name"]];
    for (const [name, abbr] of Object.entries(STATE_ABBREV)) {
      const data = stateSentiment[abbr];
      if (data) {
        matchExpr.push(name, getSentimentColor(data));
      }
    }
    matchExpr.push("rgba(100, 180, 255, 0.06)");

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
    } else {
      map.setFilter("state-selected", ["==", "name", ""]);
      map.setFilter("state-selected-fill", ["==", "name", ""]);
    }
  }, [selectedState, mapLoaded]);

  return (
    <>
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
      {/* Subtle radial gradient overlay for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 40%, transparent 40%, rgba(8, 11, 18, 0.4) 100%)",
        }}
      />
    </>
  );
}
