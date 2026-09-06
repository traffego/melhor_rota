import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Total de rotas calculadas
    const { count: totalRoutes } = await supabase
      .from("route_logs")
      .select("*", { count: "exact", head: true });

    // Últimas rotas
    const { data: recentRoutes } = await supabase
      .from("route_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    // Contagem de veículos
    const { count: totalVehicles } = await supabase
      .from("vehicles")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      totalRoutes: totalRoutes || 0,
      totalVehicles: totalVehicles || 35,
      recentRoutes: recentRoutes || [],
    });
  } catch (error: any) {
    return NextResponse.json({
      totalRoutes: 0,
      totalVehicles: 35,
      recentRoutes: [],
    });
  }
}
