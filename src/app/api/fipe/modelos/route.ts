import { NextRequest, NextResponse } from "next/server";
import { fetchFipeModels, estimateVehicleConsumption } from "@/lib/services/fipe";
import { Vehicle } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandCode = searchParams.get("brandCode");
    const brandName = searchParams.get("brandName") || "Veículo";

    if (!brandCode) {
      return NextResponse.json({ error: "brandCode é obrigatório" }, { status: 400 });
    }

    const rawModels = await fetchFipeModels(brandCode);

    // Transformar modelos Fipe em objetos Vehicle completos com dados de consumo estimados/cruzados
    const vehicles: Vehicle[] = rawModels.map((m) => {
      const consumption = estimateVehicleConsumption(m.nome, brandName);

      return {
        id: `fipe-${brandCode}-${m.codigo}`,
        brand: brandName,
        model: m.nome,
        year: 2024,
        category: consumption.category || "Passeio",
        fuel_type: consumption.fuel_type || "Flex",
        consumption_city_gasoline: consumption.consumption_city_gasoline ?? null,
        consumption_highway_gasoline: consumption.consumption_highway_gasoline ?? null,
        consumption_city_ethanol: consumption.consumption_city_ethanol ?? null,
        consumption_highway_ethanol: consumption.consumption_highway_ethanol ?? null,
        consumption_city_diesel: consumption.consumption_city_diesel ?? null,
        consumption_highway_diesel: consumption.consumption_highway_diesel ?? null,
      };
    });

    return NextResponse.json({ vehicles });
  } catch (error: any) {
    console.error("Erro ao buscar modelos Fipe:", error);
    return NextResponse.json({ vehicles: [], error: error.message }, { status: 500 });
  }
}
