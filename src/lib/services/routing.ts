import { LocationPoint, RouteResult, TollGate, Vehicle } from "@/types";
import tollsData from "@/data/tolls.json";
// @ts-ignore
import { decode as decodeFlexPolyline } from "@here/flexpolyline";

interface TollDatabaseItem {
  id: string;
  name: string;
  road: string;
  lat: number;
  lng: number;
  cost: number;
  state: string;
}

const ALL_TOLLS: TollDatabaseItem[] = tollsData as TollDatabaseItem[];

// Distância em km entre dois pontos geográficos (Haversine)
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function distanceToSegmentKm(
  pLat: number,
  pLng: number,
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const segDist = getDistanceKm(lat1, lng1, lat2, lng2);
  if (segDist === 0) return getDistanceKm(pLat, pLng, lat1, lng1);

  const d1p = getDistanceKm(lat1, lng1, pLat, pLng);
  const d2p = getDistanceKm(lat2, lng2, pLat, pLng);

  if (d1p * d1p > d2p * d2p + segDist * segDist) return d2p;
  if (d2p * d2p + d1p * d1p < 0 || d2p * d2p > d1p * d1p + segDist * segDist) return d1p;

  const s = (segDist + d1p + d2p) / 2;
  const area = Math.sqrt(Math.max(0, s * (s - segDist) * (s - d1p) * (s - d2p)));
  return (2 * area) / segDist;
}

export function detectTollsAlongGeometry(geometry: [number, number][]): {
  tolls: TollGate[];
  totalTollCost: number;
} {
  if (!geometry || geometry.length < 2) {
    return { tolls: [], totalTollCost: 0 };
  }

  const detected: TollGate[] = [];
  const MAX_DISTANCE_THRESHOLD_KM = 1.8;

  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
  for (const [lat, lng] of geometry) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }

  minLat -= 0.05; maxLat += 0.05;
  minLng -= 0.05; maxLng += 0.05;

  const candidateTolls = ALL_TOLLS.filter(
    (t) => t.lat >= minLat && t.lat <= maxLat && t.lng >= minLng && t.lng <= maxLng
  );

  for (const toll of candidateTolls) {
    let isCrossed = false;

    for (let i = 0; i < geometry.length - 1; i++) {
      const [lat1, lng1] = geometry[i];
      const [lat2, lng2] = geometry[i + 1];

      const approxDist = Math.min(
        getDistanceKm(toll.lat, toll.lng, lat1, lng1),
        getDistanceKm(toll.lat, toll.lng, lat2, lng2)
      );

      if (approxDist <= MAX_DISTANCE_THRESHOLD_KM) {
        isCrossed = true;
        break;
      }

      const dist = distanceToSegmentKm(toll.lat, toll.lng, lat1, lng1, lat2, lng2);
      if (dist <= MAX_DISTANCE_THRESHOLD_KM) {
        isCrossed = true;
        break;
      }
    }

    if (isCrossed) {
      detected.push({
        id: toll.id,
        name: toll.name,
        lat: toll.lat,
        lng: toll.lng,
        cost: toll.cost,
        road: toll.road,
      });
    }
  }

  const totalTollCost = detected.reduce((sum, t) => sum + t.cost, 0);

  return {
    tolls: detected,
    totalTollCost,
  };
}

// 1. Cálculo Automático em Tempo Real via HERE Maps API (Toll Costs)
export async function calculateRouteWithHere(
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
    const originParam = `${origin.lat},${origin.lng}`;
    const destParam = `${destination.lat},${destination.lng}`;
    const url = `https://router.hereapi.com/v8/routes?transportMode=car&origin=${originParam}&destination=${destParam}&return=polyline,summary,tolls&apiKey=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      console.warn("HERE Routing API retornou status:", response.status);
      return null;
    }

    const data = await response.json();
    const section = data.routes?.[0]?.sections?.[0];

    if (!section) {
      return null;
    }

    const distanceKm = (section.summary?.length || 0) / 1000;
    const durationMinutes = (section.summary?.duration || 0) / 60;

    // Decodificar polyline do HERE Maps
    let geometry: [number, number][] = [];
    if (section.polyline) {
      const decoded = decodeFlexPolyline(section.polyline);
      // Decoded polyline is [lat, lng, ...] or [lat, lng]
      geometry = (decoded.polyline || []).map((coord: number[]) => [coord[0], coord[1]]);
    }

    // Processar tarifas e praças de pedágios automáticas
    const rawTolls = section.tolls || [];
    const tolls: TollGate[] = [];
    let totalTollCost = 0;

    rawTolls.forEach((t: any, index: number) => {
      const fare = t.fares?.[0];
      const fareCost = fare?.price?.value ?? 0;
      const tollSystem = t.tollSystem || fare?.name || `Pedágio ${index + 1}`;
      
      const loc = t.tollCollectionLocations?.[0]?.location;
      const locName = t.tollCollectionLocations?.[0]?.name;

      totalTollCost += fareCost;

      tolls.push({
        id: `here-toll-${index}`,
        name: locName ? `Pedágio ${locName} (${tollSystem})` : `Pedágio ${tollSystem}`,
        lat: loc?.lat || (geometry[Math.floor(geometry.length / 2)]?.[0] ?? origin.lat),
        lng: loc?.lng || (geometry[Math.floor(geometry.length / 2)]?.[1] ?? origin.lng),
        cost: fareCost,
        road: tollSystem,
      });
    });

    return {
      distanceKm,
      durationMinutes,
      geometry,
      tolls,
      totalTollCost,
    };
  } catch (error) {
    console.error("Erro ao consultar HERE Tolls API:", error);
    return null;
  }
}

// 2. Fallback de Rota OSRM com base geolocalizada
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

  const geojsonCoords: [number, number][] = route.geometry?.coordinates || [];
  const geometry: [number, number][] = geojsonCoords.map(([lng, lat]) => [lat, lng]);

  const tollData = detectTollsAlongGeometry(geometry);

  return {
    distanceKm,
    durationMinutes,
    geometry,
    tolls: tollData.tolls,
    totalTollCost: tollData.totalTollCost,
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
  fuelType: 'gasolina' | 'etanol' | 'diesel' | 'gnv';
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

  let consumptionKmPerLiter = 12.0;

  if (customConsumption && customConsumption > 0) {
    consumptionKmPerLiter = customConsumption;
  } else if (vehicle) {
    if (fuelType === "gasolina") {
      consumptionKmPerLiter = vehicle.consumption_highway_gasoline || vehicle.consumption_city_gasoline || 12.0;
    } else if (fuelType === "etanol") {
      consumptionKmPerLiter = vehicle.consumption_highway_ethanol || vehicle.consumption_city_ethanol || 8.5;
    } else if (fuelType === "diesel") {
      consumptionKmPerLiter = vehicle.consumption_highway_diesel || vehicle.consumption_city_diesel || 10.5;
    } else if (fuelType === "gnv") {
      // Rendimento padrão do GNV: aproximadamente 1.25x da gasolina em km/m³ ou média 14.0 km/m³
      const gasHighway = vehicle.consumption_highway_gasoline || vehicle.consumption_city_gasoline;
      consumptionKmPerLiter = gasHighway ? gasHighway * 1.25 : 14.0;
    }
  } else if (fuelType === "gnv") {
    consumptionKmPerLiter = 14.0;
  }

  const litersNeeded = distanceKm / Math.max(consumptionKmPerLiter, 0.1);
  const fuelCost = litersNeeded * fuelPricePerLiter;
  const totalCost = fuelCost + totalTollCost;

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
