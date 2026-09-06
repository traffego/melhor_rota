import { LocationPoint, RouteResult, TollGate, Vehicle } from "@/types";

interface TollGuruTollItem {
  id?: string;
  name?: string;
  road?: string;
  lat?: number;
  lng?: number;
  tagCost?: number;
  cashCost?: number;
  cost?: number;
}

interface TollGuruRoute {
  summary?: {
    distance?: { value?: number }; // em metros
    duration?: { value?: number }; // em segundos
  };
  costs?: {
    tag?: number;
    cash?: number;
    fuel?: number;
    total?: number;
  };
  tolls?: TollGuruTollItem[];
  polyline?: string;
}

// Decodificador de Polyline do Google/Tollguru (formato codificado)
function decodePolyline(encoded: string): [number, number][] {
  const poly: [number, number][] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    poly.push([lat / 1e5, lng / 1e5]);
  }
  return poly;
}

export async function calculateRouteWithTollGuru(
  origin: LocationPoint,
  destination: LocationPoint,
  apiKey: string
): Promise<{
  distanceKm: number;
  durationMinutes: number;
  geometry: [number, number][];
  tolls: TollGate[];
  totalTollCost: number;
} | null> {
  try {
    const url = "https://apis.tollguru.com/toll/v2/origin-destination-waypoints";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        from: { lat: origin.lat, lng: origin.lng },
        to: { lat: destination.lat, lng: destination.lng },
        serviceProvider: "here",
        vehicle: {
          type: "2AxlesAuto",
        },
      }),
    });

    if (!response.ok) {
      console.warn("TollGuru API retornou status:", response.status);
      return null;
    }

    const data = await response.json();
    const route: TollGuruRoute | undefined = data.routes?.[0] || data.summary;

    if (!route) {
      return null;
    }

    const distanceMeters = route.summary?.distance?.value || 0;
    const durationSeconds = route.summary?.duration?.value || 0;
    const distanceKm = distanceMeters > 0 ? distanceMeters / 1000 : 0;
    const durationMinutes = durationSeconds > 0 ? durationSeconds / 60 : 0;

    const tolls: TollGate[] = (route.tolls || []).map((t, idx) => ({
      id: t.id || `toll-${idx}`,
      name: t.name || t.road || `Pedágio ${idx + 1}`,
      lat: t.lat || 0,
      lng: t.lng || 0,
      cost: t.tagCost ?? t.cashCost ?? t.cost ?? 0,
      road: t.road,
    }));

    const totalTollCost = route.costs?.tag ?? route.costs?.cash ?? tolls.reduce((acc, t) => acc + t.cost, 0);

    let geometry: [number, number][] = [];
    if (route.polyline) {
      geometry = decodePolyline(route.polyline);
    }

    return {
      distanceKm,
      durationMinutes,
      geometry,
      tolls,
      totalTollCost,
    };
  } catch (error) {
    console.error("Erro ao chamar TollGuru API:", error);
    return null;
  }
}

export async function calculateRouteWithOSRM(
  origin: LocationPoint,
  destination: LocationPoint
): Promise<{
  distanceKm: number;
  durationMinutes: number;
  geometry: [number, number][];
  tolls: TollGate[];
  totalTollCost: number;
}> {
  const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=true`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Erro ao calcular rota no OSRM: ${response.statusText}`);
  }

  const data = await response.json();
  const route = data.routes?.[0];

  if (!route) {
    throw new Error("Nenhuma rota encontrada.");
  }

  const distanceKm = (route.distance || 0) / 1000;
  const durationMinutes = (route.duration || 0) / 60;

  // GeoJSON coordinates são [lng, lat], converter para [lat, lng]
  const geojsonCoords: [number, number][] = route.geometry?.coordinates || [];
  const geometry: [number, number][] = geojsonCoords.map(([lng, lat]) => [lat, lng]);

  return {
    distanceKm,
    durationMinutes,
    geometry,
    tolls: [],
    totalTollCost: 0,
  };
}

export function computeTripCosts(params: {
  origin: LocationPoint;
  destination: LocationPoint;
  distanceKm: number;
  durationMinutes: number;
  geometry: [number, number][];
  tolls: TollGate[];
  totalTollCost: number;
  vehicle: Vehicle | null;
  customConsumption?: number;
  fuelType: 'gasolina' | 'etanol' | 'diesel';
  fuelPricePerLiter: number;
  isRoundTrip: boolean;
  ethanolPrice?: number;
}): RouteResult {
  const {
    origin,
    destination,
    distanceKm: baseDistance,
    durationMinutes: baseDuration,
    geometry,
    tolls: baseTolls,
    totalTollCost: baseTollCost,
    vehicle,
    customConsumption,
    fuelType,
    fuelPricePerLiter,
    isRoundTrip,
    ethanolPrice,
  } = params;

  const multiplier = isRoundTrip ? 2 : 1;
  const distanceKm = baseDistance * multiplier;
  const durationMinutes = baseDuration * multiplier;
  const totalTollCost = baseTollCost * multiplier;

  // Determinar consumo km/l
  let consumptionKmPerLiter = 12.0; // fallback padrão

  if (customConsumption && customConsumption > 0) {
    consumptionKmPerLiter = customConsumption;
  } else if (vehicle) {
    // Para viagens rodoviárias, priorizar consumo de estrada
    if (fuelType === "gasolina") {
      consumptionKmPerLiter = vehicle.consumption_highway_gasoline || vehicle.consumption_city_gasoline || 12.0;
    } else if (fuelType === "etanol") {
      consumptionKmPerLiter = vehicle.consumption_highway_ethanol || vehicle.consumption_city_ethanol || 8.5;
    } else if (fuelType === "diesel") {
      consumptionKmPerLiter = vehicle.consumption_highway_diesel || vehicle.consumption_city_diesel || 10.5;
    }
  }

  const litersNeeded = distanceKm / Math.max(consumptionKmPerLiter, 0.1);
  const fuelCost = litersNeeded * fuelPricePerLiter;
  const totalCost = fuelCost + totalTollCost;

  // Comparação Etanol vs Gasolina
  let ethanolComparison: RouteResult["ethanolComparison"] = undefined;
  if (fuelType === "gasolina" && ethanolPrice && ethanolPrice > 0) {
    let ethanolConsumption = vehicle?.consumption_highway_ethanol || vehicle?.consumption_city_ethanol || (consumptionKmPerLiter * 0.7);
    if (ethanolConsumption <= 0) ethanolConsumption = consumptionKmPerLiter * 0.7;

    const ethanolLiters = distanceKm / Math.max(ethanolConsumption, 0.1);
    const ethanolCost = ethanolLiters * ethanolPrice;
    const ethanolTotal = ethanolCost + totalTollCost;

    const priceRatio = ethanolPrice / Math.max(fuelPricePerLiter, 0.01);
    const isAdvantageous = priceRatio <= 0.70;
    const differencePercentage = ((ethanolTotal - totalCost) / totalCost) * 100;

    ethanolComparison = {
      ethanolLiters,
      ethanolCost,
      ethanolTotal,
      isEthanolAdvantageous: isAdvantageous,
      differencePercentage,
    };
  }

  return {
    origin,
    destination,
    distanceKm,
    durationMinutes,
    geometry,
    tolls: isRoundTrip ? [...baseTolls, ...baseTolls.map(t => ({ ...t, id: `${t.id}-volta`, name: `${t.name} (Volta)` }))] : baseTolls,
    totalTollCost,
    fuelCost,
    litersNeeded,
    totalCost,
    isRoundTrip,
    fuelType,
    fuelPricePerLiter,
    consumptionKmPerLiter,
    ethanolComparison,
  };
}
