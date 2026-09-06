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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Coluna Esquerda: Formulário de Cálculo e Resumo Financeiro */}
        <div className="lg:col-span-5 xl:col-span-5 order-2 lg:order-1">
          <RouteCalculator
            origin={origin}
            setOrigin={setOrigin}
            destination={destination}
            setDestination={setDestination}
            routeResult={routeResult}
            setRouteResult={setRouteResult}
          />
        </div>

        {/* Coluna Direita: Mapa Interativo Leaflet com Marcadores e Rota */}
        <div className="lg:col-span-7 xl:col-span-7 order-1 lg:order-2 lg:sticky lg:top-24 h-[420px] sm:h-[500px] lg:h-[calc(100vh-8rem)]">
          <DynamicMap
            origin={origin}
            destination={destination}
            routeResult={routeResult}
          />
        </div>
      </div>
    </div>
  );
}
