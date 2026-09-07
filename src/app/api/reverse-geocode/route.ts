import { NextRequest, NextResponse } from "next/server";

const HERE_API_KEY = process.env.HERE_API_KEY || "yAgsx1X5FBpSQ_0VF1BvY2cDaGjN-c1lDqSkcO_R_8w";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (!lat || !lng) {
      return NextResponse.json({ error: "Parâmetros lat e lng são obrigatórios" }, { status: 400 });
    }

    const nLat = parseFloat(lat);
    const nLng = parseFloat(lng);

    if (isNaN(nLat) || isNaN(nLng)) {
      return NextResponse.json({ error: "Coordenadas inválidas" }, { status: 400 });
    }

    // 1. Tentar HERE Maps Reverse Geocoding (Ultrarrápido ~100-200ms)
    try {
      const hereUrl = `https://revgeocode.search.hereapi.com/v1/revgeocode?at=${nLat},${nLng}&lang=pt-BR&apiKey=${HERE_API_KEY}`;
      const hereRes = await fetch(hereUrl, {
        headers: { "Accept": "application/json" },
        next: { revalidate: 86400 },
      });

      if (hereRes.ok) {
        const hereData = await hereRes.json();
        const item = hereData.items?.[0];

        if (item?.address) {
          const addr = item.address;
          const road = addr.street;
          const houseNumber = addr.houseNumber;
          const district = addr.district;
          const city = addr.city || addr.county;
          const state = addr.stateCode || addr.state;

          const streetPart = road ? (houseNumber ? `${road}, ${houseNumber}` : road) : "";
          const parts: string[] = [];
          if (streetPart) parts.push(streetPart);
          if (district && district !== streetPart && district !== city) parts.push(district);
          if (city) parts.push(city);
          if (state) parts.push(state);

          const fullName = parts.length > 0 ? parts.join(" - ") : (item.title || "Seu Local");

          return NextResponse.json({
            name: fullName,
            lat: nLat,
            lng: nLng,
            city,
            state,
          });
        }
      }
    } catch (hereErr) {
      console.warn("HERE RevGeo falhou, usando fallback Nominatim:", hereErr);
    }

    // 2. Fallback Nominatim
    try {
      const nomUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${nLat}&lon=${nLng}&zoom=18&addressdetails=1`;
      const nomRes = await fetch(nomUrl, {
        headers: { "User-Agent": "MelhorRotaApp/1.0" },
      });

      if (nomRes.ok) {
        const nomData = await nomRes.json();
        const addr = nomData.address || {};
        const city = addr.city || addr.town || addr.municipality || addr.village;
        const road = addr.road || addr.street;
        const houseNumber = addr.house_number;
        const suburb = addr.suburb || addr.neighbourhood;
        const state = addr.state;

        const streetPart = road ? (houseNumber ? `${road}, ${houseNumber}` : road) : "";
        const parts: string[] = [];
        if (streetPart) parts.push(streetPart);
        if (suburb && suburb !== streetPart && suburb !== city) parts.push(suburb);
        if (city) parts.push(city);
        if (state) parts.push(state);

        return NextResponse.json({
          name: parts.length > 0 ? parts.join(" - ") : (nomData.display_name || "Seu Local"),
          lat: nLat,
          lng: nLng,
          city,
          state,
        });
      }
    } catch (nomErr) {
      console.warn("Nominatim fallback falhou:", nomErr);
    }

    return NextResponse.json({
      name: `Localização Atual (${nLat.toFixed(4)}, ${nLng.toFixed(4)})`,
      lat: nLat,
      lng: nLng,
    });
  } catch (err: any) {
    console.error("Erro geral no reverse-geocode:", err);
    return NextResponse.json({ error: "Falha interna no geocoding" }, { status: 500 });
  }
}
