import { NextRequest, NextResponse } from "next/server";
import vehiclesData from "@/data/vehicles.json";
import { Vehicle } from "@/types";

const ALL_VEHICLES: Vehicle[] = vehiclesData as Vehicle[];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawQuery = (searchParams.get("q") || "").toLowerCase().trim();

    if (!rawQuery) {
      return NextResponse.json({ vehicles: ALL_VEHICLES.slice(0, 50) });
    }

    // Extrair ano digitado (ex: "Clio 2008" -> ano 2008, texto "clio")
    const yearMatch = rawQuery.match(/\b(19[89]\d|20[0-2]\d)\b/);
    const searchedYear = yearMatch ? parseInt(yearMatch[1], 10) : null;
    const cleanText = rawQuery.replace(/\b(19[89]\d|20[0-2]\d)\b/g, "").trim();

    const terms = (cleanText || rawQuery).split(/\s+/).filter(Boolean);

    // Filtrar e classificar relevância
    const scored = ALL_VEHICLES.map((v) => {
      const fullText = `${v.brand} ${v.model}`.toLowerCase();
      let score = 0;

      // Todas as palavras da busca precisam estar presentes
      const matchesAll = terms.every((term) => fullText.includes(term));
      if (!matchesAll) return null;

      const modelLower = v.model.toLowerCase();
      const brandModelLower = `${v.brand} ${v.model}`.toLowerCase();

      if (modelLower.startsWith(cleanText)) score += 100;
      if (brandModelLower.startsWith(cleanText)) score += 80;
      if (modelLower.includes(cleanText)) score += 50;

      return {
        vehicle: {
          ...v,
          year: searchedYear || v.year,
        },
        score,
      };
    }).filter(Boolean) as { vehicle: Vehicle; score: number }[];

    scored.sort((a, b) => b.score - a.score);

    const results = scored.slice(0, 60).map((s) => s.vehicle);

    return NextResponse.json({ vehicles: results });
  } catch (error: any) {
    console.error("Erro ao buscar veículos:", error);
    return NextResponse.json({ vehicles: ALL_VEHICLES.slice(0, 50) }, { status: 500 });
  }
}
