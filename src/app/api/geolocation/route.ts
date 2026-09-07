import { NextRequest, NextResponse } from "next/server";
import { reverseGeocode } from "@/lib/services/photon";

export async function GET(request: NextRequest) {
  try {
    // 1. Tentar obter localização por IP via serviço público gratuito
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
    });
  } catch (error: any) {
    console.error("Erro na geolocalização por IP:", error);
    return NextResponse.json({
      name: "São Paulo - SP",
      lat: -23.55052,
      lng: -46.633308,
      city: "São Paulo",
      state: "SP",
    });
  }
}
