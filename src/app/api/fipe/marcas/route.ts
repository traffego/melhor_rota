import { NextResponse } from "next/server";
import { fetchFipeBrands } from "@/lib/services/fipe";

export async function GET() {
  try {
    const brands = await fetchFipeBrands();
    return NextResponse.json({ brands });
  } catch (error: any) {
    return NextResponse.json({ brands: [], error: error.message }, { status: 500 });
  }
}
