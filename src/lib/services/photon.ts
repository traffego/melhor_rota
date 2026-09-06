import { LocationPoint } from "@/types";

export interface PhotonFeature {
  geometry: {
    coordinates: [number, number]; // [lng, lat]
  };
  properties: {
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
    district?: string;
    county?: string;
  };
}

export async function searchAddress(query: string): Promise<LocationPoint[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const encoded = encodeURIComponent(query.trim());
    // Focando a busca com prioridade no Brasil usando bbox ou lat/lon central
    const url = `https://photon.komoot.io/api/?q=${encoded}&limit=7&lat=-15.7801&lon=-47.9292`;
    
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Photon search error: ${response.statusText}`);
    }

    const data = await response.json();
    const features: PhotonFeature[] = data.features || [];

    return features.map((feat) => {
      const [lng, lat] = feat.geometry.coordinates;
      const p = feat.properties;

      // Montar nome formatado amigável
      const parts: string[] = [];
      if (p.name) parts.push(p.name);
      if (p.street && p.street !== p.name) parts.push(p.street);
      if (p.district) parts.push(p.district);
      if (p.city && p.city !== p.name) parts.push(p.city);
      if (p.state) parts.push(p.state);
      if (p.country && p.country !== "Brazil" && p.country !== "Brasil") parts.push(p.country);

      const fullName = parts.length > 0 ? parts.join(", ") : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

      return {
        name: fullName,
        lat,
        lng,
        city: p.city || p.county,
        state: p.state,
      };
    });
  } catch (error) {
    console.error("Erro na busca de endereço Photon:", error);
    return [];
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<LocationPoint | null> {
  try {
    const url = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`;
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      return {
        name: `Localização Atual (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        lat,
        lng,
      };
    }

    const data = await response.json();
    const feat: PhotonFeature | undefined = data.features?.[0];

    if (!feat) {
      return {
        name: `Localização Atual (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        lat,
        lng,
      };
    }

    const p = feat.properties;
    const parts: string[] = [];
    if (p.name) parts.push(p.name);
    if (p.street && p.street !== p.name) parts.push(p.street);
    if (p.city) parts.push(p.city);
    if (p.state) parts.push(p.state);

    return {
      name: parts.length > 0 ? parts.join(", ") : "Seu Local",
      lat,
      lng,
      city: p.city,
      state: p.state,
    };
  } catch (error) {
    console.error("Erro no geocoding reverso:", error);
    return {
      name: `Localização Atual (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      lat,
      lng,
    };
  }
}
