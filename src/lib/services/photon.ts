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
    countrycode?: string;
    postcode?: string;
    district?: string;
    county?: string;
    type?: string;
  };
}

const BRAZIL_STATES: Record<string, string> = {
  "Acre": "AC", "Alagoas": "AL", "Amapá": "AP", "Amazonas": "AM", "Bahia": "BA",
  "Ceará": "CE", "Distrito Federal": "DF", "Espírito Santo": "ES", "Goiás": "GO",
  "Maranhão": "MA", "Mato Grosso": "MT", "Mato Grosso do Sul": "MS", "Minas Gerais": "MG",
  "Pará": "PA", "Paraíba": "PB", "Paraná": "PR", "Pernambuco": "PE", "Piauí": "PI",
  "Rio de Janeiro": "RJ", "Rio Grande do Norte": "RN", "Rio Grande do Sul": "RS",
  "Rondônia": "RO", "Roraima": "RR", "Santa Catarina": "SC", "São Paulo": "SP",
  "Sergipe": "SE", "Tocantins": "TO"
};

function formatStateUF(stateName?: string): string {
  if (!stateName) return "";
  return BRAZIL_STATES[stateName] || stateName;
}

function isInsideBrazil(lat: number, lng: number): boolean {
  // Bounding box aproximado do território brasileiro
  return lat >= -34.0 && lat <= 5.5 && lng >= -74.0 && lng <= -34.5;
}

export async function searchAddress(query: string): Promise<LocationPoint[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const cleanQuery = query.trim();

  try {
    const encoded = encodeURIComponent(cleanQuery);
    // Busca restrita ao Bounding Box do Brasil
    const photonUrl = `https://photon.komoot.io/api/?q=${encoded}&bbox=-73.99,-33.75,-34.79,5.27&limit=10&lang=default`;

    const response = await fetch(photonUrl, {
      headers: { "Accept": "application/json" },
    });

    let results: LocationPoint[] = [];

    if (response.ok) {
      const data = await response.json();
      const features: PhotonFeature[] = data.features || [];

      const rawResults = features
        .filter((feat) => {
          const [lng, lat] = feat.geometry.coordinates;
          const p = feat.properties;
          const isBrCountry = !p.countrycode || p.countrycode.toUpperCase() === "BR" ||
                             p.country === "Brasil" || p.country === "Brazil";
          return isInsideBrazil(lat, lng) && isBrCountry;
        })
        .map((feat) => {
          const [lng, lat] = feat.geometry.coordinates;
          const p = feat.properties;
          const uf = formatStateUF(p.state);

          // Formatação limpa para o padrão brasileiro
          let title = p.name || "";
          if (p.street && p.street !== title) {
            title = p.housenumber ? `${p.street}, ${p.housenumber}` : p.street;
          }

          const secondaryParts: string[] = [];
          if (p.district) secondaryParts.push(p.district);
          if (p.city && p.city !== title) secondaryParts.push(p.city);
          if (uf) secondaryParts.push(uf);

          const fullName = secondaryParts.length > 0 
            ? `${title} - ${secondaryParts.join(", ")}` 
            : (uf ? `${title} - ${uf}` : title);

          return {
            name: fullName,
            lat,
            lng,
            city: p.city || p.county,
            state: uf || p.state,
          };
        });

      // Deduplicar nomes idênticos
      const seenNames = new Set<string>();
      for (const item of rawResults) {
        if (!seenNames.has(item.name)) {
          seenNames.add(item.name);
          results.push(item);
        }
      }
    }

    // Se Photon retornar poucos resultados, consultar Nominatim com countrycodes=br
    if (results.length < 3) {
      try {
        const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&countrycodes=br&addressdetails=1&limit=6`;
        const nomRes = await fetch(nomUrl, {
          headers: { "User-Agent": "MelhorRotaApp/1.0" },
        });

        if (nomRes.ok) {
          const nomData = await nomRes.json();
          const nomResults: LocationPoint[] = nomData.map((item: any) => {
            const addr = item.address || {};
            const state = formatStateUF(addr.state);
            const city = addr.city || addr.town || addr.municipality || addr.village;
            const road = addr.road || addr.street;
            const title = road ? (addr.house_number ? `${road}, ${addr.house_number}` : road) : (item.name || city);

            const details: string[] = [];
            if (addr.suburb && addr.suburb !== title) details.push(addr.suburb);
            if (city && city !== title) details.push(city);
            if (state) details.push(state);

            const name = details.length > 0 ? `${title} - ${details.join(", ")}` : item.display_name;

            return {
              name,
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
              city,
              state,
            };
          });

          // Unir resultados sem duplicatas de coordenadas próximas
          for (const nr of nomResults) {
            const exists = results.some(
              (r) => Math.abs(r.lat - nr.lat) < 0.001 && Math.abs(r.lng - nr.lng) < 0.001
            );
            if (!exists) {
              results.push(nr);
            }
          }
        }
      } catch (nomErr) {
        console.warn("Fallback Nominatim ignorado:", nomErr);
      }
    }

    return results;
  } catch (error) {
    console.error("Erro na busca de endereço Photon/BR:", error);
    return [];
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<LocationPoint | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const response = await fetch(url, {
      headers: { "User-Agent": "MelhorRotaApp/1.0" },
    });

    if (response.ok) {
      const data = await response.json();
      const addr = data.address || {};
      const state = formatStateUF(addr.state);
      const city = addr.city || addr.town || addr.municipality || addr.village;
      const road = addr.road || addr.street;
      const houseNumber = addr.house_number;
      const suburb = addr.suburb || addr.neighbourhood || addr.city_district;

      let streetPart = "";
      if (road) {
        streetPart = houseNumber ? `${road}, ${houseNumber}` : road;
      }

      const parts: string[] = [];
      if (streetPart) parts.push(streetPart);
      if (suburb && suburb !== streetPart && suburb !== city) parts.push(suburb);
      if (city) parts.push(city);
      if (state) parts.push(state);

      const formattedName = parts.length > 0 ? parts.join(" - ") : (data.display_name || "Seu Local");

      return {
        name: formattedName,
        lat,
        lng,
        city,
        state,
      };
    }

    return {
      name: `Localização Atual (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      lat,
      lng,
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
