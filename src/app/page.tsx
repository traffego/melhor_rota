"use client";

import { useState } from "react";
import { LocationPoint, RouteResult } from "@/types";
import { RouteCalculator } from "@/components/RouteCalculator";
import { DynamicMap } from "@/components/DynamicMap";

export default function HomePage() {
  const [origin, setOrigin] = useState<LocationPoint | null>(null);
  const [destination, setDestination] = useState<LocationPoint | null>(null);
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);

  return (
    <div className="w-full max-w-[1920px] mx-auto p-3 sm:p-4 lg:h-[calc(100vh-4.1rem)]">
      <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 h-full items-stretch">
        {/* Sidebar Esquerda: Formulário Compacto + Resumo Financeiro */}
        <aside className="w-full lg:w-[420px] xl:w-[460px] shrink-0 lg:h-full flex flex-col">
          <RouteCalculator
            origin={origin}
            setOrigin={setOrigin}
            destination={destination}
            setDestination={setDestination}
            routeResult={routeResult}
            setRouteResult={setRouteResult}
          />
        </aside>

        {/* Mapa Protagonista: Ocupa todo o espaço restante */}
        <main className="flex-1 w-full h-[450px] sm:h-[520px] lg:h-full min-h-[400px]">
          <DynamicMap
            origin={origin}
            destination={destination}
            routeResult={routeResult}
          />
        </main>
      </div>
    </div>
  );
}
