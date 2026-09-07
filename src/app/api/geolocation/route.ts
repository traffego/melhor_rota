import { NextRequest, NextResponse } from "next/server";
import { reverseGeocode } from "@/lib/services/photon";

export async function GET(request: NextRequest) {
  try {
    const res = await fetch("https://get.geojs.io/v1/ip/geo.json", {
      headers: { "Accept": "application/json" },
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const data = await res.json();
      const lat = parseFloat(data.latitude);
      const lng = parseFloat(data.longitude);

      if (!isNaN(lat) && !isNaN(lng) && data.city) {
        const city = data.city || "";
        const region = data.region || "";
        const name = city ? (region ? `${city} - ${region}` : city) : "Seu Local";

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

    return NextResponse.json({
      name: "Seu Local",
      lat: -23.55052,
      lng: -46.633308,
      city: "São Paulo",
      state: "SP",
      source: "fallback",
    });
  } catch (error: any) {
    console.error("Erro na geolocalização por IP:", error);
    return NextResponse.json({
      name: "Seu Local",
      lat: -23.55052,
      lng: -46.633308,
      city: "São Paulo",
      state: "SP",
      source: "fallback",
    });
  }
}
