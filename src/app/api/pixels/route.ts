import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("pixel_settings")
      .select("platform, name, pixel_id, is_active, custom_events_config")
      .eq("is_active", true);

    if (error || !data) {
      return NextResponse.json({ pixels: [] });
    }

    return NextResponse.json({ pixels: data });
  } catch (error) {
    console.error("Erro ao obter pixels ativos:", error);
    return NextResponse.json({ pixels: [] });
  }
}
