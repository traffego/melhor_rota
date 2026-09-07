import { NextRequest, NextResponse } from "next/server";
import { LocationPoint } from "@/types";

const HERE_API_KEY = process.env.HERE_API_KEY || "yAgsx1X5FBpSQ_0VF1BvY2cDaGjN-c1lDqSkcO_R_8w";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");

    if (!q || q.trim().length < 2) {
      return NextResponse.json({ results: [] });
    }

    const cleanQuery = q.trim();
    const encoded = encodeURIComponent(cleanQuery);
    const results: LocationPoint[] = [];
    const seenCoordinates = new Set<string>();

    const addUniqueResult = (item: LocationPoint) => {
      const coordKey = `${item.lat.toFixed(4)},${item.lng.toFixed(4)}`;
      if (!seenCoordinates.has(coordKey) && !seenCoordinates.has(item.name.toLowerCase())) {
        seenCoordinates.add(coordKey);
        seenCoordinates.add(item.name.toLowerCase());
        results.push(item);
      }
    };

    // 1. HERE Discover API (Busca inteligente de Pontos de Interesse: Paróquias, Escolas, Bares, Shoppings, etc.)
    try {
      const discoverUrl = `https://discover.search.hereapi.com/v1/discover?q=${encoded}&in=countryCode:BRA&lang=pt-BR&limit=8&apiKey=${HERE_API_KEY}`;
      const hereRes = await fetch(discoverUrl, {
        headers: { "Accept": "application/json" },
        next: { revalidate: 3600 },
      });

      if (hereRes.ok) {
        const hereData = await hereRes.json();
        const items = hereData.items || [];

        for (const item of items) {
          if (item?.position?.lat && item?.position?.lng) {
            const addr = item.address || {};
            const title = item.title || "";
            const street = addr.street || "";
            const houseNumber = addr.houseNumber || "";
            const streetPart = street ? (houseNumber ? `${street}, ${houseNumber}` : street) : "";
            const district = addr.district || "";
            const city = addr.city || addr.county || "";
            const state = addr.stateCode || addr.state || "";

            const details: string[] = [];
            if (streetPart && streetPart !== title) details.push(streetPart);
            if (district && district !== streetPart && district !== city) details.push(district);
            if (city && city !== title) details.push(city);
            if (state) details.push(state);

            const fullName = details.length > 0 ? `${title} - ${details.join(", ")}` : title;

            addUniqueResult({
              name: fullName,
              lat: item.position.lat,
              lng: item.position.lng,
              city,
              state,
            });
          }
        }
      }
    } catch (hereErr) {
      console.warn("HERE Discover falhou:", hereErr);
    }

    // 2. Se poucos resultados, consultar HERE Geocode API (Endereços exatos, avenidas, rodovias)
    if (results.length < 5) {
      try {
        const geocodeUrl = `https://geocode.search.hereapi.com/v1/geocode?q=${encoded}&in=countryCode:BRA&lang=pt-BR&limit=6&apiKey=${HERE_API_KEY}`;
        const geoRes = await fetch(geocodeUrl, {
          headers: { "Accept": "application/json" },
          next: { revalidate: 3600 },
        });

        if (geoRes.ok) {
          const geoData = await geoRes.json();
          const items = geoData.items || [];

          for (const item of items) {
            if (item?.position?.lat && item?.position?.lng) {
              const addr = item.address || {};
              const title = item.title || "";
              const street = addr.street || "";
              const houseNumber = addr.houseNumber || "";
              const streetPart = street ? (houseNumber ? `${street}, ${houseNumber}` : street) : "";
              const district = addr.district || "";
              const city = addr.city || addr.county || "";
              const state = addr.stateCode || addr.state || "";

              const details: string[] = [];
              if (streetPart && streetPart !== title) details.push(streetPart);
              if (district && district !== streetPart && district !== city) details.push(district);
              if (city && city !== title) details.push(city);
              if (state) details.push(state);

              const fullName = details.length > 0 ? `${title} - ${details.join(", ")}` : title;

              addUniqueResult({
                name: fullName,
                lat: item.position.lat,
                lng: item.position.lng,
                city,
                state,
              });
            }
          }
        }
      } catch (geoErr) {
        console.warn("HERE Geocode falhou:", geoErr);
      }
    }

    // 3. Fallback Photon Komoot (OpenStreetMap) se a busca for muito específica ou HERE retornar vazio
    if (results.length === 0) {
      try {
        const photonUrl = `https://photon.komoot.io/api/?q=${encoded}&bbox=-73.99,-33.75,-34.79,5.27&limit=6&lang=default`;
        const photonRes = await fetch(photonUrl, {
          headers: { "Accept": "application/json" },
        });

        if (photonRes.ok) {
          const photonData = await photonRes.json();
          const features = photonData.features || [];

          for (const feat of features) {
            const [lng, lat] = feat.geometry?.coordinates || [];
            if (lat && lng) {
              const p = feat.properties || {};
              const title = p.name || p.street || "";
              const city = p.city || p.county || "";
              const state = p.state || "";

              const details: string[] = [];
              if (city && city !== title) details.push(city);
              if (state) details.push(state);

              const fullName = details.length > 0 ? `${title} - ${details.join(", ")}` : title;

              if (fullName) {
                addUniqueResult({
                  name: fullName,
                  lat,
                  lng,
                  city,
                  state,
                });
              }
            }
          }
        }
      } catch (pErr) {
        console.warn("Photon fallback falhou:", pErr);
      }
    }

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("Erro na busca de locais / POIs:", error);
    return NextResponse.json({ results: [] });
  }
}
