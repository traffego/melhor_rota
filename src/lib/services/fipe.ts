import { Vehicle } from "@/types";

export interface FipeBrand {
  codigo: string;
  nome: string;
}

export interface FipeModel {
  codigo: number;
  nome: string;
}

// Tabela base de referência Inmetro para estimativa inteligente de consumo quando não houver correspondência exata
export function estimateVehicleConsumption(modelName: string, brandName: string): Partial<Vehicle> {
  const lower = `${brandName} ${modelName}`.toLowerCase();

  // Elétrico
  if (lower.includes("elétrico") || lower.includes("eletrico") || lower.includes(" ev") || lower.includes("dolphin") || lower.includes("seal") || lower.includes("kwid e-tech")) {
    return {
      category: "Elétrico",
      fuel_type: "Elétrico",
      consumption_city_gasoline: null,
      consumption_highway_gasoline: null,
      consumption_city_ethanol: null,
      consumption_highway_ethanol: null,
      consumption_city_diesel: null,
      consumption_highway_diesel: null,
    };
  }

  // Híbrido
  if (lower.includes("hybrid") || lower.includes("híbrido") || lower.includes("hibrido") || lower.includes("dm-i") || lower.includes("phev") || lower.includes("hev")) {
    return {
      category: "Híbrido",
      fuel_type: "Híbrido",
      consumption_city_gasoline: 18.5,
      consumption_highway_gasoline: 16.5,
      consumption_city_ethanol: 12.5,
      consumption_highway_ethanol: 11.0,
      consumption_city_diesel: null,
      consumption_highway_diesel: null,
    };
  }

  // Diesel (Picapes e utilitários)
  if (lower.includes("diesel") || lower.includes("4x4") || lower.includes("hilux") || lower.includes("ranger") || lower.includes("s10") || lower.includes("amarok") || lower.includes("frontier") || lower.includes("l200") || lower.includes("ram ")) {
    let city = 9.5;
    let highway = 11.0;
    if (lower.includes("2.8") || lower.includes("3.0") || lower.includes("v6") || lower.includes("ram")) {
      city = 8.5;
      highway = 10.0;
    }
    return {
      category: "Picape / SUV",
      fuel_type: "Diesel",
      consumption_city_gasoline: null,
      consumption_highway_gasoline: null,
      consumption_city_ethanol: null,
      consumption_highway_ethanol: null,
      consumption_city_diesel: city,
      consumption_highway_diesel: highway,
    };
  }

  // Categoria SUV
  const isSuv = lower.includes("suv") || lower.includes("creta") || lower.includes("renegade") || lower.includes("compass") || lower.includes("kicks") || lower.includes("tracker") || lower.includes("t-cross") || lower.includes("nivus") || lower.includes("pulse") || lower.includes("fastback") || lower.includes("duster") || lower.includes("hr-v") || lower.includes("corolla cross") || lower.includes("tiggo");

  // Estimativa por Cilindrada / Motorização Flex
  if (lower.includes("1.0") || lower.includes("turbo") || lower.includes("tsi") || lower.includes("t200") || lower.includes("firefly")) {
    if (lower.includes("turbo") || lower.includes("tsi") || lower.includes("t200")) {
      return {
        category: isSuv ? "SUV" : "Hatch / Sedan",
        fuel_type: "Flex",
        consumption_city_gasoline: isSuv ? 11.5 : 13.0,
        consumption_highway_gasoline: isSuv ? 13.8 : 15.8,
        consumption_city_ethanol: isSuv ? 8.1 : 9.2,
        consumption_highway_ethanol: isSuv ? 9.8 : 11.2,
      };
    }
    // 1.0 Aspirado
    return {
      category: isSuv ? "SUV" : "Hatch",
      fuel_type: "Flex",
      consumption_city_gasoline: 13.8,
      consumption_highway_gasoline: 15.5,
      consumption_city_ethanol: 9.6,
      consumption_highway_ethanol: 10.8,
    };
  }

  if (lower.includes("1.3") || lower.includes("1.4") || lower.includes("1.5")) {
    return {
      category: isSuv ? "SUV" : "Hatch / Sedan",
      fuel_type: "Flex",
      consumption_city_gasoline: isSuv ? 11.0 : 12.5,
      consumption_highway_gasoline: isSuv ? 13.0 : 14.5,
      consumption_city_ethanol: isSuv ? 7.8 : 8.8,
      consumption_highway_ethanol: isSuv ? 9.2 : 10.2,
    };
  }

  if (lower.includes("1.6") || lower.includes("1.8")) {
    return {
      category: isSuv ? "SUV" : "Sedan / Hatch",
      fuel_type: "Flex",
      consumption_city_gasoline: isSuv ? 10.5 : 11.8,
      consumption_highway_gasoline: isSuv ? 12.5 : 13.9,
      consumption_city_ethanol: isSuv ? 7.4 : 8.2,
      consumption_highway_ethanol: isSuv ? 8.8 : 9.8,
    };
  }

  if (lower.includes("2.0") || lower.includes("2.5") || lower.includes("2.4")) {
    return {
      category: isSuv ? "SUV" : "Sedan Médio",
      fuel_type: "Flex",
      consumption_city_gasoline: isSuv ? 9.5 : 10.8,
      consumption_highway_gasoline: isSuv ? 11.5 : 13.5,
      consumption_city_ethanol: isSuv ? 6.7 : 7.6,
      consumption_highway_ethanol: isSuv ? 8.2 : 9.4,
    };
  }

  // Padrão Geral Médio
  return {
    category: isSuv ? "SUV" : "Passeio",
    fuel_type: "Flex",
    consumption_city_gasoline: 11.5,
    consumption_highway_gasoline: 14.0,
    consumption_city_ethanol: 8.0,
    consumption_highway_ethanol: 9.8,
  };
}

let cachedBrands: FipeBrand[] | null = null;

export async function fetchFipeBrands(): Promise<FipeBrand[]> {
  if (cachedBrands && cachedBrands.length > 0) {
    return cachedBrands;
  }

  try {
    const res = await fetch("https://parallelum.com.br/fipe/api/v1/carros/marcas", {
      next: { revalidate: 86400 }, // Cache de 24h
    });

    if (!res.ok) {
      throw new Error(`Fipe API error: ${res.statusText}`);
    }

    const data: FipeBrand[] = await res.json();
    cachedBrands = data;
    return data;
  } catch (error) {
    console.error("Erro ao buscar marcas Fipe:", error);
    return [];
  }
}

export async function fetchFipeModels(brandCode: string): Promise<FipeModel[]> {
  try {
    const res = await fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${brandCode}/modelos`, {
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      throw new Error(`Fipe models error: ${res.statusText}`);
    }

    const data = await res.json();
    return data.modelos || [];
  } catch (error) {
    console.error(`Erro ao buscar modelos Fipe da marca ${brandCode}:`, error);
    return [];
  }
}
