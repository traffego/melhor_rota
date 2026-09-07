import { NextRequest, NextResponse } from "next/server";
import { LocationPoint } from "@/types";

const HERE_API_KEY = process.env.HERE_API_KEY || "yAgsx1X5FBpSQ_0VF1BvY2cDaGjN-c1lDqSkcO_R_8w";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    const userLat = searchParams.get("lat");
    const userLng = searchParams.get("lng");

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

    const formatAddressItem = (item: any): LocationPoint | null => {
      if (!item?.position?.lat || !item?.position?.lng) return null;

      const addr = item.address || {};
      const title = item.title || "";
      const street = addr.street || "";
      const houseNumber = addr.houseNumber || "";
      const streetPart = street ? (houseNumber ? `${street}, ${houseNumber}` : street) : "";
      const district = addr.district || "";
      const city = addr.city || addr.county || "";
      const state = addr.stateCode || addr.state || "";

      const details: string[] = [];
      if (streetPart && !title.includes(streetPart)) details.push(streetPart);
      if (district && !title.includes(district)) details.push(district);
      if (city && !title.includes(city)) details.push(city);
      if (state && !title.includes(state)) details.push(state);

      const fullName = details.length > 0 ? `${title} - ${details.join(", ")}` : (item.address?.label || title);

      return {
        name: fullName,
        lat: item.position.lat,
        lng: item.position.lng,
        city,
        state,
      };
    };

    // 1. HERE Discover API com BBox Brasil (Busca de POIs: Paróquias, Escolas, Shoppings, Restaurantes)
    try {
      const discoverUrl = `https://discover.search.hereapi.com/v1/discover?q=${encoded}&in=countryCode:BRA&in=bbox:-73.99,-33.75,-34.79,5.27&lang=pt-BR&limit=8&apiKey=${HERE_API_KEY}`;
      const hereRes = await fetch(discoverUrl, {
        headers: { "Accept": "application/json" },
        next: { revalidate: 3600 },
      });

      if (hereRes.ok) {
        const hereData = await hereRes.json();
        const items = hereData.items || [];
        for (const item of items) {
          const loc = formatAddressItem(item);
          if (loc) addUniqueResult(loc);
        }
      }
    } catch (hereErr) {
      console.warn("HERE Discover falhou:", hereErr);
    }

    // 2. HERE Autosuggest API (Com viés geográfico do usuário ou centro do Brasil)
    try {
      const centerPoint = (userLat && userLng) ? `${userLat},${userLng}` : "-15.78,-47.93";
      const autoUrl = `https://autosuggest.search.hereapi.com/v1/autosuggest?q=${encoded}&in=countryCode:BRA&at=${centerPoint}&lang=pt-BR&limit=8&apiKey=${HERE_API_KEY}`;
      const autoRes = await fetch(autoUrl, {
        headers: { "Accept": "application/json" },
        next: { revalidate: 3600 },
      });

      if (autoRes.ok) {
        const autoData = await autoRes.json();
        const items = autoData.items || [];
        for (const item of items) {
          const loc = formatAddressItem(item);
          if (loc) addUniqueResult(loc);
        }
      }
    } catch (autoErr) {
      console.warn("HERE Autosuggest falhou:", autoErr);
    }

    // 3. HERE Geocode API (Endereços exatos, ruas e numerações)
    if (results.length < 6) {
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
            const loc = formatAddressItem(item);
            if (loc) addUniqueResult(loc);
          }
        }
      } catch (geoErr) {
        console.warn("HERE Geocode falhou:", geoErr);
      }
    }

    // 4. Fallback Photon Komoot (OpenStreetMap)
    if (results.length < 3) {
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
              if (p.district) details.push(p.district);
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
