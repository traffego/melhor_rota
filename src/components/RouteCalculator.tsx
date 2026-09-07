"use client";

import { useState } from "react";
import { 
  Navigation, 
  MapPin, 
  Sparkles, 
  Loader2, 
  ArrowUpDown, 
  AlertTriangle 
} from "lucide-react";
import { LocationPoint, RouteResult, Vehicle } from "@/types";
import { AddressAutocomplete } from "./AddressAutocomplete";
import { VehicleSelector } from "./VehicleSelector";
import { FuelCalculator } from "./FuelCalculator";
import { RouteSummary } from "./RouteSummary";
import { triggerPixelEvent } from "./PixelTracker";

interface RouteCalculatorProps {
  origin: LocationPoint | null;
  setOrigin: (loc: LocationPoint | null) => void;
  destination: LocationPoint | null;
  setDestination: (loc: LocationPoint | null) => void;
  routeResult: RouteResult | null;
  setRouteResult: (res: RouteResult | null) => void;
}

export function RouteCalculator({
  origin,
  setOrigin,
  destination,
  setDestination,
  routeResult,
  setRouteResult,
}: RouteCalculatorProps) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [customConsumption, setCustomConsumption] = useState<number | undefined>(undefined);
  const [fuelType, setFuelType] = useState<'gasolina' | 'etanol' | 'diesel'>('gasolina');
  const [fuelPrice, setFuelPrice] = useState<number>(6.05);
  const [ethanolPrice, setEthanolPrice] = useState<number>(4.09);
  const [isRoundTrip, setIsRoundTrip] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSwapPoints = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleCalculateRoute = async () => {
    if (!origin || !destination) {
      setErrorMessage("Por favor, preencha o local de partida e o destino.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin,
          destination,
          vehicle,
          customConsumption,
          fuelType,
          fuelPricePerLiter: fuelPrice,
          isRoundTrip,
          ethanolPrice,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Falha ao calcular rota.");
      }

      setRouteResult(data);

      // Disparar evento de pixel de conversão/rastreamento com dados ricos da rota
      triggerPixelEvent("CalculateRoute", {
        origin: origin.name,
        destination: destination.name,
        vehicle_brand: vehicle?.brand || "Personalizado",
        vehicle_model: vehicle?.model || "Personalizado",
        distance_km: data.distanceKm,
        total_cost: data.totalCost,
        fuel_cost: data.fuelCost,
        toll_cost: data.totalTollCost,
        is_round_trip: isRoundTrip,
      });
    } catch (err: any) {
      console.error("Erro no cálculo da rota:", err);
      setErrorMessage(err.message || "Não foi possível calcular a rota. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleRoundTrip = async (newVal: boolean) => {
    setIsRoundTrip(newVal);
    if (routeResult) {
      // Recalcular instantaneamente com o novo valor de ida e volta
      try {
        const response = await fetch("/api/route", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            origin,
            destination,
            vehicle,
            customConsumption,
            fuelType,
            fuelPricePerLiter: fuelPrice,
            isRoundTrip: newVal,
            ethanolPrice,
          }),
        });
        if (response.ok) {
          const updated = await response.json();
          setRouteResult(updated);
        }
      } catch (e) {
        console.error("Erro ao atualizar ida e volta:", e);
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-xl border border-slate-200/80 flex flex-col h-full overflow-hidden">
      {/* Cabeçalho Compacto */}
      <div className="pb-2.5 mb-2.5 border-b border-slate-100 shrink-0">
        <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center justify-between">
          <span>Cálculo de Viagem</span>
          <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Tempo Real
          </span>
        </h1>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Combustível, pedágios atualizados e consumo por modelo.
        </p>
      </div>

      {/* Conteúdo com Scroll Suave Interno */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 scrollbar-thin scrollbar-thumb-slate-200">
        {/* Inputs de Origem e Destino com botão de inverter */}
        <div className="space-y-2 relative">
          <AddressAutocomplete
            label="Origem"
            placeholder="Digite ponto de partida..."
            value={origin}
            onChange={setOrigin}
            showCurrentLocationButton={true}
          />

          <div className="flex justify-center -my-2 relative z-10">
            <button
              type="button"
              onClick={handleSwapPoints}
              className="p-1 bg-white hover:bg-slate-100 text-slate-500 hover:text-emerald-600 rounded-full border border-slate-300 shadow-sm transition-transform hover:rotate-180"
              title="Inverter origem e destino"
            >
              <ArrowUpDown className="w-3 h-3" />
            </button>
          </div>

          <AddressAutocomplete
            label="Destino"
            placeholder="Digite destino final..."
            value={destination}
            onChange={setDestination}
          />
        </div>

        {/* Seletor de Veículo Inmetro */}
        <VehicleSelector
          selectedVehicle={vehicle}
          onSelectVehicle={setVehicle}
          customConsumption={customConsumption}
          onChangeCustomConsumption={setCustomConsumption}
          fuelType={fuelType}
        />

        {/* Calculadora de Combustível & Preço */}
        <FuelCalculator
          fuelType={fuelType}
          onChangeFuelType={setFuelType}
          fuelPrice={fuelPrice}
          onChangeFuelPrice={setFuelPrice}
          ethanolPrice={ethanolPrice}
          onChangeEthanolPrice={setEthanolPrice}
        />

        {/* Mensagem de Erro */}
        {errorMessage && (
          <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-800">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Botão de Ação Principal */}
        <button
          type="button"
          onClick={handleCalculateRoute}
          disabled={isLoading || !origin || !destination}
          className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Calculando rota e pedágios...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span>Calcular Rota & Custos</span>
            </>
          )}
        </button>

        {/* Exibição do Resumo quando a rota estiver calculada */}
        {routeResult && (
          <div className="pt-2 border-t border-slate-200">
            <RouteSummary
              result={routeResult}
              isRoundTrip={isRoundTrip}
              onToggleRoundTrip={handleToggleRoundTrip}
            />
          </div>
        )}
      </div>
    </div>
  );
}
