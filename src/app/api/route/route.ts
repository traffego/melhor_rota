import { NextRequest, NextResponse } from "next/server";
import { calculateRouteWithHere, calculateRouteWithOSRM, computeTripCosts } from "@/lib/services/routing";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { LocationPoint, Vehicle } from "@/types";

interface RouteRequestBody {
  origin: LocationPoint;
  destination: LocationPoint;
  vehicle: Vehicle | null;
  customConsumption?: number;
  fuelType: 'gasolina' | 'etanol' | 'diesel';
  fuelPricePerLiter: number;
  isRoundTrip: boolean;
  ethanolPrice?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: RouteRequestBody = await request.json();
    const { origin, destination, vehicle, customConsumption, fuelType, fuelPricePerLiter, isRoundTrip, ethanolPrice } = body;

    if (!origin || !destination || origin.lat === undefined || destination.lat === undefined) {
      return NextResponse.json({ error: "Origem e destino válidos são obrigatórios." }, { status: 400 });
    }

    if (!vehicle && !customConsumption) {
      return NextResponse.json({ error: "É obrigatório selecionar um veículo para calcular a rota." }, { status: 400 });
    }

    const hereApiKey = process.env.HERE_API_KEY;
    let routeData: {
      distanceKm: number;
      durationMinutes: number;
      geometry: [number, number][];
      tolls: any[];
      totalTollCost: number;
    } | null = null;

    // 1. Tentar cálculo automático com tarifas oficiais em tempo real via HERE API
    if (hereApiKey && hereApiKey.trim().length > 0) {
      routeData = await calculateRouteWithHere(origin, destination, hereApiKey.trim());
    }

    // 2. Fallback gracioso com OSRM + base de praças geolocalizadas
    if (!routeData) {
      routeData = await calculateRouteWithOSRM(origin, destination);
    }

    const tripResult = computeTripCosts({
      origin,
      destination,
      distanceKm: routeData.distanceKm,
      durationMinutes: routeData.durationMinutes,
      geometry: routeData.geometry,
      tolls: routeData.tolls,
      totalTollCost: routeData.totalTollCost,
      vehicle,
      customConsumption,
      fuelType,
      fuelPricePerLiter,
      isRoundTrip,
      ethanolPrice,
    });

    // Registrar log no Supabase em background de forma silenciosa
    try {
      const supabase = await createServerSupabaseClient();
      await supabase.from("route_logs").insert({
        origin_name: origin.name,
        origin_lat: origin.lat,
        origin_lng: origin.lng,
        destination_name: destination.name,
        destination_lat: destination.lat,
        destination_lng: destination.lng,
        vehicle_name: vehicle ? `${vehicle.brand} ${vehicle.model}` : "Personalizado",
        vehicle_brand: vehicle?.brand || "Personalizado",
        vehicle_model: vehicle?.model || "Personalizado",
        distance_km: tripResult.distanceKm,
        duration_minutes: tripResult.durationMinutes,
        fuel_type: fuelType,
        fuel_price: fuelPricePerLiter,
        fuel_cost: tripResult.fuelCost,
        toll_cost: tripResult.totalTollCost,
        total_cost: tripResult.totalCost,
        is_round_trip: isRoundTrip,
      });
    } catch (logErr) {
      // Falha não impeditiva
    }

    return NextResponse.json(tripResult);
  } catch (error: any) {
    console.error("Erro ao calcular rota:", error);
    return NextResponse.json(
      { error: error?.message || "Não foi possível traçar a rota para os pontos fornecidos." },
      { status: 500 }
    );
  }
}
