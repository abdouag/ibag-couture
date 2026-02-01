"use client";

import { useRef, useEffect, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// Coordonnees de la boutique — modifier ici pour changer la position
const BOUTIQUE = {
  name: "Ibag Couture",
  address: "Pikine Rue 10, Dakar, Senegal",
  lng: -17.3907,
  lat: 14.7506,
  zoom: 14,
};

// CARTO free basemap (meme tiles que mapcn) — pas de cle API requise
const CARTO_STYLE =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

export default function FooterMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    try {
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: CARTO_STYLE,
        center: [BOUTIQUE.lng, BOUTIQUE.lat],
        zoom: BOUTIQUE.zoom,
        attributionControl: false,
        scrollZoom: false,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
      });

      map.addControl(
        new maplibregl.NavigationControl({ showCompass: false }),
        "bottom-right"
      );

      // Marqueur personnalise
      const markerEl = document.createElement("div");
      markerEl.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer">
          <div style="
            background:#44403c;
            border-radius:50%;
            width:36px;
            height:36px;
            display:flex;
            align-items:center;
            justify-content:center;
            box-shadow:0 2px 8px rgba(0,0,0,0.25);
            border:2px solid #fafaf9;
          ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fafaf9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div style="
            width:2px;
            height:8px;
            background:#44403c;
            border-radius:0 0 1px 1px;
          "></div>
        </div>
      `;

      const marker = new maplibregl.Marker({ element: markerEl })
        .setLngLat([BOUTIQUE.lng, BOUTIQUE.lat])
        .addTo(map);

      // Popup au clic sur le marqueur
      const popup = new maplibregl.Popup({
        offset: [0, -48],
        closeButton: false,
        maxWidth: "220px",
      }).setHTML(`
        <div style="padding:8px 4px;font-family:inherit">
          <p style="font-weight:600;font-size:14px;margin:0 0 4px;color:#1c1917">
            ${BOUTIQUE.name}
          </p>
          <p style="font-size:12px;color:#78716c;margin:0">
            ${BOUTIQUE.address}
          </p>
        </div>
      `);

      marker.setPopup(popup);

      // Ouvrir le popup par defaut
      map.on("load", () => {
        popup.addTo(map);
      });

      mapRef.current = map;
    } catch {
      setError(true);
    }

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  if (error) {
    return (
      <div className="w-full h-full bg-stone-800 rounded-lg flex items-center justify-center text-stone-400 text-sm">
        <a
          href={`https://www.google.com/maps/search/${encodeURIComponent(BOUTIQUE.name + " " + BOUTIQUE.address)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          {BOUTIQUE.name} &mdash; {BOUTIQUE.address}
        </a>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-lg overflow-hidden"
      aria-label={`Carte de localisation de ${BOUTIQUE.name}`}
    />
  );
}
