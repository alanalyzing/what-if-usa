/**
 * DESIGN: Tactical Command Center — Full-Screen Map Visualization
 * MapLibre GL JS with US States GeoJSON overlay, choropleth sentiment coloring, click-to-filter
 */

import { useApp } from "@/contexts/AppContext";
import { STATE_NAMES } from "@/lib/types";
import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const GEOJSON_URL = "https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json";

// Map state abbreviations from GeoJSON names
const STATE_ABBREV: Record<string, string> = {};
for (const [abbr, name] of Object.entries(STATE_NAMES)) {
  STATE_ABBREV[name] = abbr;
}

function getSentimentColor(data: { positive: number; neutral: number; negative: number; total: number } | undefined): string {
  if (!data || data.total === 0) return "rgba(0, 240, 255, 0.08)";
  const posRatio = data.positive / data.total;
  const negRatio = data.negative / data.total;
  // Green to amber to red scale
  if (posRatio > 0.5) {
    const intensity = 0.15 + posRatio * 0.35;
    return `rgba(0, 255, 136, ${intensity})`;
  }
  if (negRatio > 0.5) {
    const intensity = 0.15 + negRatio * 0.35;
    return `rgba(255, 59, 92, ${intensity})`;
  }
  const intensity = 0.15 + (data.neutral / data.total) * 0.25;
  return `rgba(255, 184, 0, ${intensity})`;
}

export default function USAMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const { stateSentiment, selectedState, setSelectedState } = useApp();
  const selectedStateRef = useRef(selectedState);
  selectedStateRef.current = selectedState;
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
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
            paint: { "background-color": "#0A0E17" },
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
      // Load US states GeoJSON
      try {
        const res = await fetch(GEOJSON_URL);
        const geojson = await res.json();

        map.addSource("us-states", {
          type: "geojson",
          data: geojson,
        });

        // State fill layer
        map.addLayer({
          id: "state-fills",
          type: "fill",
          source: "us-states",
          paint: {
            "fill-color": "rgba(0, 240, 255, 0.08)",
            "fill-opacity": 0.9,
          },
        });

        // State borders
        map.addLayer({
          id: "state-borders",
          type: "line",
          source: "us-states",
          paint: {
            "line-color": "rgba(0, 240, 255, 0.25)",
            "line-width": 1,
          },
        });

        // Hover highlight
        map.addLayer({
          id: "state-hover",
          type: "fill",
          source: "us-states",
          paint: {
            "fill-color": "rgba(0, 240, 255, 0.15)",
            "fill-opacity": 0,
          },
        });

        // Selected state highlight
        map.addLayer({
          id: "state-selected",
          type: "line",
          source: "us-states",
          paint: {
            "line-color": "#00F0FF",
            "line-width": 2.5,
          },
          filter: ["==", "name", ""],
        });

        setMapLoaded(true);
      } catch (err) {
        console.error("Failed to load GeoJSON:", err);
      }
    });

    // Hover effects
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

      // Show tooltip
      const abbr = STATE_ABBREV[name] || "";
      if (popupRef.current) popupRef.current.remove();
      popupRef.current = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: "state-tooltip",
        offset: 10,
      })
        .setLngLat(e.lngLat)
        .setHTML(`
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #00F0FF; padding: 4px 8px; background: rgba(10,14,23,0.9); border: 1px solid rgba(0,240,255,0.3); border-radius: 4px; backdrop-filter: blur(10px);">
            <strong>${name}</strong> ${abbr ? `(${abbr})` : ""}
          </div>
        `)
        .addTo(map);
    });

    map.on("mouseleave", "state-fills", () => {
      hoveredStateName = "";
      map.getCanvas().style.cursor = "";
      map.setPaintProperty("state-hover", "fill-opacity", 0);
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
    });

    // Click to select state
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

  // Update choropleth colors based on sentiment
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;

    if (Object.keys(stateSentiment).length === 0) {
      map.setPaintProperty("state-fills", "fill-color", "rgba(0, 240, 255, 0.08)");
      return;
    }

    // Build a match expression for fill colors
    const matchExpr: any[] = ["match", ["get", "name"]];
    for (const [name, abbr] of Object.entries(STATE_ABBREV)) {
      const data = stateSentiment[abbr];
      if (data) {
        matchExpr.push(name, getSentimentColor(data));
      }
    }
    matchExpr.push("rgba(0, 240, 255, 0.08)"); // default

    map.setPaintProperty("state-fills", "fill-color", matchExpr);
  }, [stateSentiment, mapLoaded]);

  // Update selected state highlight
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;

    if (selectedState) {
      const name = STATE_NAMES[selectedState] || "";
      map.setFilter("state-selected", ["==", "name", name]);
    } else {
      map.setFilter("state-selected", ["==", "name", ""]);
    }
  }, [selectedState, mapLoaded]);

  return (
    <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
  );
}
