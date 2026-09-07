"use client";

import { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LocationPoint, RouteResult, TollGate } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Layers } from "lucide-react";

interface MapProps {
  origin: LocationPoint | null;
  destination: LocationPoint | null;
  routeResult: RouteResult | null;
}

export type MapStyle = "mono" | "standard" | "satellite" | "dark";

const TILE_LAYERS: Record<MapStyle, { url: string; attribution: string; maxZoom: number; className?: string }> = {
  mono: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    className: "map-tiles-mono",
  },
  standard: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
    maxZoom: 19,
  },
  dark: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    className: "map-tiles-dark",
  },
};

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
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const polylineLayerRef = useRef<L.Polyline | null>(null);
  const [mapStyle, setMapStyle] = useState<MapStyle>("standard");

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

    // Camada padrão Colorida (OpenStreetMap)
    const initialConfig = TILE_LAYERS.standard;
    const tileLayer = L.tileLayer(initialConfig.url, {
      attribution: initialConfig.attribution,
      maxZoom: initialConfig.maxZoom,
      className: initialConfig.className || "",
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    // Focar no estado/cidade do usuário no estado zero
    if (!origin && !destination && !routeResult) {
      if (typeof window !== "undefined" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (!origin && !destination && !routeResult && mapInstanceRef.current) {
              mapInstanceRef.current.setView([pos.coords.latitude, pos.coords.longitude], 10, { animate: true });
            }
          },
          async () => {
            // Fallback por IP caso o usuário não conceda GPS
            try {
              const res = await fetch("/api/geolocation");
              if (res.ok) {
                const data = await res.json();
                if (data.lat && data.lng && !origin && !destination && !routeResult && mapInstanceRef.current) {
                  mapInstanceRef.current.setView([data.lat, data.lng], 9, { animate: true });
                }
              }
            } catch (e) {
              console.error("Erro ao obter geolocalização inicial:", e);
            }
          },
          { timeout: 5000, maximumAge: 300000 }
        );
      } else {
        fetch("/api/geolocation")
          .then((res) => res.json())
          .then((data) => {
            if (data.lat && data.lng && !origin && !destination && !routeResult && mapInstanceRef.current) {
              mapInstanceRef.current.setView([data.lat, data.lng], 9, { animate: true });
            }
          })
          .catch(() => {});
      }
    }

    // Garantir renderização correta ao redimensionar tela
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Trocar camada de tiles dinamicamente
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const config = TILE_LAYERS[mapStyle];
    const newTileLayer = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: config.maxZoom,
      className: config.className || "",
    }).addTo(map);

    tileLayerRef.current = newTileLayer;
  }, [mapStyle]);

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

    // Ajustar zoom para caber todos os pontos mantendo nível acima da rua
    if (bounds.isValid()) {
      if (origin && !destination && !routeResult) {
        map.setView([origin.lat, origin.lng], 14);
      } else if (!origin && destination && !routeResult) {
        map.setView([destination.lat, destination.lng], 14);
      } else {
        map.fitBounds(bounds, { padding: [45, 45], maxZoom: 14 });
      }
    }
  }, [origin, destination, routeResult]);

  return (
    <div className="relative w-full h-full min-h-[400px] md:min-h-[500px] lg:min-h-full rounded-2xl overflow-hidden shadow-inner border border-slate-200">
      {/* Seletor Flutuante de Estilos de Visualização */}
      <div className="absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-md border border-slate-200/80 flex items-center gap-1">
        <button
          type="button"
          onClick={() => setMapStyle("mono")}
          className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all flex items-center gap-1 ${
            mapStyle === "mono"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
          title="Mapa Monocromático Clean (Preto e Branco)"
        >
          <span>P&B</span>
        </button>

        <button
          type="button"
          onClick={() => setMapStyle("standard")}
          className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all flex items-center gap-1 ${
            mapStyle === "standard"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
          title="Mapa com Cores e Ruas Padrão"
        >
          <span>Colorido</span>
        </button>

        <button
          type="button"
          onClick={() => setMapStyle("satellite")}
          className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all flex items-center gap-1 ${
            mapStyle === "satellite"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
          title="Imagens Reais de Satélite"
        >
          <span>Satélite</span>
        </button>

        <button
          type="button"
          onClick={() => setMapStyle("dark")}
          className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all flex items-center gap-1 ${
            mapStyle === "dark"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
          title="Modo Noturno / Dark"
        >
          <span>Noturno</span>
        </button>
      </div>

      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
