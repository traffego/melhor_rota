"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { LocationPoint, RouteResult } from "@/types";

interface DynamicMapProps {
  origin: LocationPoint | null;
  destination: LocationPoint | null;
  routeResult: RouteResult | null;
}

const MapComponent = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] md:min-h-[500px] lg:min-h-full rounded-2xl bg-slate-100 flex flex-col items-center justify-center text-slate-400 gap-2 border border-slate-200">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      <span className="text-xs font-semibold">Carregando mapa interativo...</span>
    </div>
  ),
});

export function DynamicMap(props: DynamicMapProps) {
  return <MapComponent {...props} />;
}
