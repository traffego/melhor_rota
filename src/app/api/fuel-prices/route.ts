import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const DEFAULT_PRICES = [
  { state_uf: "BR", state_name: "Média Brasil", gasoline_avg: 6.05, ethanol_avg: 4.09, diesel_avg: 5.95, gnv_avg: 4.68 },
  { state_uf: "SP", state_name: "São Paulo", gasoline_avg: 5.89, ethanol_avg: 3.89, diesel_avg: 5.85, gnv_avg: 4.79 },
  { state_uf: "RJ", state_name: "Rio de Janeiro", gasoline_avg: 6.12, ethanol_avg: 4.29, diesel_avg: 6.05, gnv_avg: 4.49 },
  { state_uf: "MG", state_name: "Minas Gerais", gasoline_avg: 6.08, ethanol_avg: 4.15, diesel_avg: 5.92, gnv_avg: 4.89 },
  { state_uf: "PR", state_name: "Paraná", gasoline_avg: 6.15, ethanol_avg: 4.25, diesel_avg: 5.88, gnv_avg: 4.95 },
  { state_uf: "SC", state_name: "Santa Catarina", gasoline_avg: 6.19, ethanol_avg: 4.39, diesel_avg: 5.94, gnv_avg: 4.85 },
  { state_uf: "RS", state_name: "Rio Grande do Sul", gasoline_avg: 6.22, ethanol_avg: 4.45, diesel_avg: 5.99, gnv_avg: 5.09 },
  { state_uf: "BA", state_name: "Bahia", gasoline_avg: 6.29, ethanol_avg: 4.49, diesel_avg: 6.09, gnv_avg: 4.75 },
  { state_uf: "GO", state_name: "Goiás", gasoline_avg: 5.98, ethanol_avg: 3.99, diesel_avg: 5.89, gnv_avg: 4.99 },
  { state_uf: "DF", state_name: "Distrito Federal", gasoline_avg: 6.02, ethanol_avg: 4.05, diesel_avg: 5.90, gnv_avg: 4.89 }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uf = searchParams.get("uf")?.toUpperCase();

    const supabase = await createServerSupabaseClient();
    const { data: dbPrices, error } = await supabase.from("fuel_prices").select("*");

    const prices = (!error && dbPrices && dbPrices.length > 0) ? dbPrices : DEFAULT_PRICES;

    if (uf) {
      const found = prices.find((p) => p.state_uf === uf);
      if (found) {
        return NextResponse.json(found);
      }
    }

    // Retorna todos os preços e destaca a média BR
    const brAverage = prices.find((p) => p.state_uf === "BR") || prices[0];
    return NextResponse.json({ prices, current: brAverage });
  } catch (error) {
    console.error("Erro ao buscar preços de combustível:", error);
    return NextResponse.json({ prices: DEFAULT_PRICES, current: DEFAULT_PRICES[0] });
  }
}
