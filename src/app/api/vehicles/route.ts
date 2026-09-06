import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Lista padrão de veículos PBEV Inmetro (caso o banco ainda esteja em processo de sincronização)
const DEFAULT_INMETRO_VEHICLES = [
  { brand: 'Chevrolet', model: 'Onix', version: '1.0 Turbo MT', year: 2024, category: 'Hatch', fuel_type: 'Flex', consumption_city_gasoline: 13.3, consumption_highway_gasoline: 16.5, consumption_city_ethanol: 9.4, consumption_highway_ethanol: 11.6, consumption_city_diesel: null, consumption_highway_diesel: null },
  { brand: 'Chevrolet', model: 'Onix Plus', version: '1.0 Turbo AT', year: 2024, category: 'Sedan', fuel_type: 'Flex', consumption_city_gasoline: 12.3, consumption_highway_gasoline: 15.6, consumption_city_ethanol: 8.6, consumption_highway_ethanol: 10.9, consumption_city_diesel: null, consumption_highway_diesel: null },
  { brand: 'Chevrolet', model: 'Tracker', version: '1.0 Turbo AT', year: 2024, category: 'SUV', fuel_type: 'Flex', consumption_city_gasoline: 11.2, consumption_highway_gasoline: 13.4, consumption_city_ethanol: 7.8, consumption_highway_ethanol: 9.6, consumption_city_diesel: null, consumption_highway_diesel: null },
  { brand: 'Chevrolet', model: 'S10', version: '2.8 Turbo Diesel 4x4', year: 2024, category: 'Picape', fuel_type: 'Diesel', consumption_city_gasoline: null, consumption_highway_gasoline: null, consumption_city_ethanol: null, consumption_highway_ethanol: null, consumption_city_diesel: 9.2, consumption_highway_diesel: 10.6 },
  { brand: 'Fiat', model: 'Strada', version: '1.3 Firefly Flex', year: 2024, category: 'Picape', fuel_type: 'Flex', consumption_city_gasoline: 12.4, consumption_highway_gasoline: 13.9, consumption_city_ethanol: 8.8, consumption_highway_ethanol: 9.9, consumption_city_diesel: null, consumption_highway_diesel: null },
  { brand: 'Fiat', model: 'Mobi', version: '1.0 Fire Flex', year: 2024, category: 'Hatch', fuel_type: 'Flex', consumption_city_gasoline: 13.5, consumption_highway_gasoline: 15.0, consumption_city_ethanol: 9.6, consumption_highway_ethanol: 10.4, consumption_city_diesel: null, consumption_highway_diesel: null },
  { brand: 'Fiat', model: 'Pulse', version: '1.0 Turbo AT', year: 2024, category: 'SUV', fuel_type: 'Flex', consumption_city_gasoline: 12.0, consumption_highway_gasoline: 14.4, consumption_city_ethanol: 8.4, consumption_highway_ethanol: 10.2, consumption_city_diesel: null, consumption_highway_diesel: null },
  { brand: 'Fiat', model: 'Toro', version: '1.3 Turbo Flex', year: 2024, category: 'Picape', fuel_type: 'Flex', consumption_city_gasoline: 9.7, consumption_highway_gasoline: 11.6, consumption_city_ethanol: 6.8, consumption_highway_ethanol: 8.2, consumption_city_diesel: null, consumption_highway_diesel: null },
  { brand: 'Fiat', model: 'Fastback', version: '1.0 Turbo AT', year: 2024, category: 'SUV', fuel_type: 'Flex', consumption_city_gasoline: 11.9, consumption_highway_gasoline: 13.9, consumption_city_ethanol: 8.4, consumption_highway_ethanol: 9.8, consumption_city_diesel: null, consumption_highway_diesel: null },
  { brand: 'Hyundai', model: 'HB20', version: '1.0 12V Flex MT', year: 2024, category: 'Hatch', fuel_type: 'Flex', consumption_city_gasoline: 13.1, consumption_highway_gasoline: 14.8, consumption_city_ethanol: 9.4, consumption_highway_ethanol: 10.4, consumption_city_diesel: null, consumption_highway_diesel: null },
  { brand: 'Hyundai', model: 'HB20', version: '1.0 Turbo AT', year: 2024, category: 'Hatch', fuel_type: 'Flex', consumption_city_gasoline: 12.1, consumption_highway_gasoline: 14.4, consumption_city_ethanol: 8.3, consumption_highway_ethanol: 10.1, consumption_city_diesel: null, consumption_highway_diesel: null },
  { brand: 'Hyundai', model: 'Creta', version: '1.0 Turbo AT', year: 2024, category: 'SUV', fuel_type: 'Flex', consumption_city_gasoline: 11.5, consumption_highway_gasoline: 12.0, consumption_city_ethanol: 8.2, consumption_highway_ethanol: 8.9, consumption_city_diesel: null, consumption_highway_diesel: null },
  { brand: 'Volkswagen', model: 'Polo', version: '1.0 TSI MT', year: 2024, category: 'Hatch', fuel_type: 'Flex', consumption_city_gasoline: 14.0, consumption_highway_gasoline: 16.4, consumption_city_ethanol: 9.6, consumption_highway_ethanol: 11.5, consumption_city_diesel: null, consumption_highway_diesel: null },
  { brand: 'Volkswagen', model: 'Polo Track', version: '1.0 MPI MT', year: 2024, category: 'Hatch', fuel_type: 'Flex', consumption_city_gasoline: 13.7, consumption_highway_gasoline: 15.2, consumption_city_ethanol: 9.4, consumption_highway_ethanol: 10.8, consumption_city_diesel: null, consumption_highway_diesel: null },
  { brand: 'Volkswagen', model: 'Nivus', version: '1.0 TSI AT', year: 2024, category: 'SUV', fuel_type: 'Flex', consumption_city_gasoline: 11.9, consumption_highway_gasoline: 14.1, consumption_city_ethanol: 8.3, consumption_highway_ethanol: 9.9, consumption_city_diesel: null, consumption_highway_diesel: null },
  { brand: 'Volkswagen', model: 'T-Cross', version: '1.0 TSI AT', year: 2024, category: 'SUV', fuel_type: 'Flex', consumption_city_gasoline: 11.7, consumption_highway_gasoline: 14.0, consumption_city_ethanol: 8.2, consumption_highway_ethanol: 9.8, consumption_city_diesel: null, consumption_highway_diesel: null },
  { brand: 'Volkswagen', model: 'Saveiro', version: '1.6 MSI Flex', year: 2024, category: 'Picape', fuel_type: 'Flex', consumption_city_gasoline: 11.5, consumption_highway_gasoline: 12.9, consumption_city_ethanol: 7.9, consumption_highway_ethanol: 9.1, consumption_city_diesel: null, consumption_highway_diesel: null },
  { brand: 'Toyota', model: 'Corolla', version: '2.0 Dynamic Force AT', year: 2024, category: 'Sedan', fuel_type: 'Flex', consumption_city_gasoline: 11.9, consumption_highway_gasoline: 14.2, consumption_city_ethanol: 8.3, consumption_highway_ethanol: 9.8, consumption_city_diesel: null, consumption_highway_diesel: null },
  { brand: 'Toyota', model: 'Corolla Hybrid', version: '1.8 Hybrid Flex', year: 2024, category: 'Sedan', fuel_type: 'Híbrido', consumption_city_gasoline: 17.9, consumption_highway_gasoline: 15.4, consumption_city_ethanol: 12.8, consumption_highway_ethanol: 11.1, consumption_city_diesel: null, consumption_highway_diesel: null },
  { brand: 'Toyota', model: 'Corolla Cross', version: '2.0 Flex AT', year: 2024, category: 'SUV', fuel_type: 'Flex', consumption_city_gasoline: 11.7, consumption_highway_gasoline: 13.0, consumption_city_ethanol: 8.2, consumption_highway_ethanol: 9.0, consumption_city_diesel: null, consumption_highway_diesel: null },
  { brand: 'Toyota', model: 'Hilux', version: '2.8 Turbo Diesel 4x4', year: 2024, category: 'Picape', fuel_type: 'Diesel', consumption_city_gasoline: null, consumption_highway_gasoline: null, consumption_city_ethanol: null, consumption_highway_ethanol: null, consumption_city_diesel: 10.1, consumption_highway_diesel: 11.3 },
  { brand: 'Toyota', model: 'Yaris', version: '1.5 Flex AT', year: 2024, category: 'Hatch', fuel_type: 'Flex', consumption_city_gasoline: 12.2, consumption_highway_gasoline: 13.9, consumption_city_ethanol: 8.7, consumption_highway_ethanol: 9.8, consumption_city_diesel: null, consumption_highway_diesel: null },
  { brand: 'Jeep', model: 'Renegade', version: '1.3 Turbo Flex AT', year: 2024, category: 'SUV', fuel_type: 'Flex', consumption_city_gasoline: 11.0, consumption_highway_gasoline: 12.8, consumption_city_ethanol: 7.7, consumption_highway_ethanol: 9.1, consumption_city_diesel: null, consumption_highway_diesel: null },
  { brand: 'Jeep', model: 'Compass', version: '1.3 Turbo Flex AT', year: 2024, category: 'SUV', fuel_type: 'Flex', consumption_city_gasoline: 10.3, consumption_highway_gasoline: 11.9, consumption_city_ethanol: 7.2, consumption_highway_ethanol: 8.3, consumption_city_diesel: null, consumption_highway_diesel: null },
  { brand: 'Honda', model: 'HR-V', version: '1.5 Flex AT', year: 2024, category: 'SUV', fuel_type: 'Flex', consumption_city_gasoline: 12.7, consumption_highway_gasoline: 13.9, consumption_city_ethanol: 8.8, consumption_highway_ethanol: 9.8, consumption_city_diesel: null, consumption_highway_diesel: null },
  { brand: 'Honda', model: 'City', version: '1.5 Flex AT', year: 2024, category: 'Sedan', fuel_type: 'Flex', consumption_city_gasoline: 13.1, consumption_highway_gasoline: 15.2, consumption_city_ethanol: 9.2, consumption_highway_ethanol: 10.5, consumption_city_diesel: null, consumption_highway_diesel: null },
  { brand: 'Nissan', model: 'Kicks', version: '1.6 Flex CVT', year: 2024, category: 'SUV', fuel_type: 'Flex', consumption_city_gasoline: 11.4, consumption_highway_gasoline: 13.8, consumption_city_ethanol: 7.8, consumption_highway_ethanol: 9.5, consumption_city_diesel: null, consumption_highway_diesel: null },
  { brand: 'Renault', model: 'Kwid', version: '1.0 SCe MT', year: 2024, category: 'Hatch', fuel_type: 'Flex', consumption_city_gasoline: 15.3, consumption_highway_gasoline: 15.7, consumption_city_ethanol: 10.8, consumption_highway_ethanol: 11.0, consumption_city_diesel: null, consumption_highway_diesel: null },
  { brand: 'Ford', model: 'Ranger', version: '2.0 Turbo Diesel AT', year: 2024, category: 'Picape', fuel_type: 'Diesel', consumption_city_gasoline: null, consumption_highway_gasoline: null, consumption_city_ethanol: null, consumption_highway_ethanol: null, consumption_city_diesel: 10.0, consumption_highway_diesel: 11.5 },
  { brand: 'BYD', model: 'Song Plus', version: '1.5 DM-i Híbrido', year: 2024, category: 'SUV', fuel_type: 'Híbrido', consumption_city_gasoline: 21.0, consumption_highway_gasoline: 20.0, consumption_city_ethanol: null, consumption_highway_ethanol: null, consumption_city_diesel: null, consumption_highway_diesel: null }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") || "").toLowerCase().trim();
    const brand = searchParams.get("brand");

    const supabase = await createServerSupabaseClient();
    let queryBuilder = supabase.from("vehicles").select("*");

    if (brand) {
      queryBuilder = queryBuilder.eq("brand", brand);
    }

    if (query) {
      queryBuilder = queryBuilder.or(`brand.ilike.%${query}%,model.ilike.%${query}%,version.ilike.%${query}%`);
    }

    const { data: dbVehicles, error } = await queryBuilder.order("brand", { ascending: true }).limit(50);

    if (!error && dbVehicles && dbVehicles.length > 0) {
      return NextResponse.json({ vehicles: dbVehicles, source: "database" });
    }

    // Se o banco de dados ainda não tiver os registros inseridos, filtrar os veículos padrão
    let filtered = DEFAULT_INMETRO_VEHICLES.map((v, i) => ({ id: `default-${i}`, ...v }));

    if (brand) {
      filtered = filtered.filter((v) => v.brand.toLowerCase() === brand.toLowerCase());
    }

    if (query) {
      filtered = filtered.filter((v) =>
        `${v.brand} ${v.model} ${v.version}`.toLowerCase().includes(query)
      );
    }

    return NextResponse.json({ vehicles: filtered, source: "inmetro_catalog" });
  } catch (error) {
    console.error("Erro ao buscar veículos:", error);
    return NextResponse.json({ vehicles: [], error: "Falha ao buscar veículos" }, { status: 500 });
  }
}
