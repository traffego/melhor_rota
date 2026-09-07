import { NextRequest, NextResponse } from "next/server";
import { reverseGeocode } from "@/lib/services/photon";

export async function GET(request: NextRequest) {
  try {
    // 1. Tentar ler headers nativos da Vercel Edge (0ms de latência)
    const vercelLat = request.headers.get("x-vercel-ip-latitude");
    const vercelLng = request.headers.get("x-vercel-ip-longitude");
    const vercelCity = request.headers.get("x-vercel-ip-city");
    const vercelRegion = request.headers.get("x-vercel-ip-country-region");

    if (vercelLat && vercelLng) {
      const lat = parseFloat(vercelLat);
      const lng = parseFloat(vercelLng);
      if (!isNaN(lat) && !isNaN(lng)) {
        const rawCity = vercelCity ? decodeURIComponent(vercelCity) : "";
        const state = vercelRegion ? decodeURIComponent(vercelRegion) : "";
        const name = rawCity ? (state ? `${rawCity} - ${state}` : rawCity) : (state || "Seu Local");

        return NextResponse.json({
          name,
          lat,
          lng,
          city: rawCity,
          state,
          source: "vercel-edge",
        });
      }
    }

    // 2. Tentar obter localização por IP via serviço público de alta velocidade
    const res = await fetch("https://get.geojs.io/v1/ip/geo.json", {
      headers: { "Accept": "application/json" },
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const data = await res.json();
      const lat = parseFloat(data.latitude);
      const lng = parseFloat(data.longitude);

      if (!isNaN(lat) && !isNaN(lng)) {
        const city = data.city || "";
        const region = data.region || "";
        const name = city ? `${city} - ${region}` : "Seu Local";

        return NextResponse.json({
          name,
          lat,
          lng,
          city,
          state: region,
          source: "geojs",
        });
      }
    }

    // Fallback padrão se falhar
    return NextResponse.json({
      name: "São Paulo - SP",
      lat: -23.55052,
      lng: -46.633308,
      city: "São Paulo",
      state: "SP",
      source: "fallback",
    });
  } catch (error: any) {
    console.error("Erro na geolocalização por IP:", error);
    return NextResponse.json({
      name: "São Paulo - SP",
      lat: -23.55052,
      lng: -46.633308,
      city: "São Paulo",
      state: "SP",
      source: "fallback",
    });
  }
}
