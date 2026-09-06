"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LocationPoint, RouteResult, TollGate } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface MapProps {
  origin: LocationPoint | null;
  destination: LocationPoint | null;
  routeResult: RouteResult | null;
}

// Ícones SVG personalizados para Leaflet
const createCustomIcon = (color: string, iconHtml: string) => {
  return L.divIcon({
    className: "custom-leaflet-marker",
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
      ">
        <div style="transform: rotate(45deg); color: white; display: flex; align-items: center; justify-content: center;">
          ${iconHtml}
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const originIcon = createCustomIcon(
  "#059669", // Emerald
  `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="8"/></svg>`
);

const destinationIcon = createCustomIcon(
  "#dc2626", // Red
  `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`
);

const tollIcon = createCustomIcon(
  "#d97706", // Amber
  `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/></svg>`
);

export default function Map({ origin, destination, routeResult }: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const polylineLayerRef = useRef<L.Polyline | null>(null);

  // Inicializar o Mapa Leaflet
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Coordenadas centrais padrão (Brasil - Brasília)
    const map = L.map(mapContainerRef.current, {
      center: [-15.7801, -47.9292],
      zoom: 5,
      zoomControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Adicionar camada OpenStreetMap Tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Atualizar marcadores e rota no mapa
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    // Limpar camadas anteriores
    markersGroup.clearLayers();
    if (polylineLayerRef.current) {
      map.removeLayer(polylineLayerRef.current);
      polylineLayerRef.current = null;
    }

    const bounds = L.latLngBounds([]);

    // 1. Marcador de Origem
    if (origin) {
      const origMarker = L.marker([origin.lat, origin.lng], { icon: originIcon })
        .bindPopup(`<strong>Origem:</strong><br/>${origin.name}`);
      markersGroup.addLayer(origMarker);
      bounds.extend([origin.lat, origin.lng]);
    }

    // 2. Marcador de Destino
    if (destination) {
      const destMarker = L.marker([destination.lat, destination.lng], { icon: destinationIcon })
        .bindPopup(`<strong>Destino:</strong><br/>${destination.name}`);
      markersGroup.addLayer(destMarker);
      bounds.extend([destination.lat, destination.lng]);
    }

    // 3. Marcadores de Pedágios
    if (routeResult?.tolls && routeResult.tolls.length > 0) {
      routeResult.tolls.forEach((toll: TollGate) => {
        if (toll.lat && toll.lng) {
          const tollMarker = L.marker([toll.lat, toll.lng], { icon: tollIcon })
            .bindPopup(`
              <div style="font-size: 13px;">
                <strong style="color: #b45309;">🛣️ Praça de Pedágio</strong><br/>
                <b>${toll.name}</b><br/>
                ${toll.road ? `<span style="color: #64748b;">${toll.road}</span><br/>` : ""}
                <span style="color: #059669; font-weight: bold;">Tarifa: ${formatCurrency(toll.cost)}</span>
              </div>
            `);
          markersGroup.addLayer(tollMarker);
          bounds.extend([toll.lat, toll.lng]);
        }
      });
    }

    // 4. Traçado da Polyline da Rota
    if (routeResult?.geometry && routeResult.geometry.length > 0) {
      const polyline = L.polyline(routeResult.geometry, {
        color: "#059669",
        weight: 5,
        opacity: 0.85,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);

      polylineLayerRef.current = polyline;

      routeResult.geometry.forEach((coord) => bounds.extend(coord));
    }

    // Ajustar zoom para caber todos os pontos
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [origin, destination, routeResult]);

  return (
    <div className="relative w-full h-full min-h-[400px] md:min-h-[500px] lg:min-h-full rounded-2xl overflow-hidden shadow-inner border border-slate-200">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
