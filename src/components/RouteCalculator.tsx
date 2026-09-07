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
import { reverseGeocode } from "@/lib/services/photon";
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
  const [fuelType, setFuelType] = useState<'gasolina' | 'etanol' | 'diesel' | 'gnv'>('gasolina');
  const [fuelPrice, setFuelPrice] = useState<number>(6.05);
  const [ethanolPrice, setEthanolPrice] = useState<number>(4.09);
  const [isRoundTrip, setIsRoundTrip] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGetCurrentLocation = async () => {
    setIsLocating(true);

    const fallbackIPLocation = async () => {
      try {
        const res = await fetch("https://get.geojs.io/v1/ip/geo.json");
        if (res.ok) {
          const data = await res.json();
          const lat = parseFloat(data.latitude);
          const lng = parseFloat(data.longitude);
          if (!isNaN(lat) && !isNaN(lng)) {
            const loc = await reverseGeocode(lat, lng);
            if (loc) {
              setOrigin(loc);
              return true;
            } else if (data.city) {
              const fallbackLoc: LocationPoint = {
                name: `${data.city}${data.region ? ` - ${data.region}` : ""}`,
                lat,
                lng,
                city: data.city,
                state: data.region,
              };
              setOrigin(fallbackLoc);
              return true;
            }
          }
        }
      } catch (err) {
        console.error("Erro fallback IP:", err);
      }
      return false;
    };

    const processCoords = async (latitude: number, longitude: number) => {
      try {
        const loc = await reverseGeocode(latitude, longitude);
        if (loc) {
          setOrigin(loc);
          return true;
        }
      } catch (err) {
        console.error("Erro ao obter endereço do local:", err);
      }
      return false;
    };

    if (!navigator.geolocation) {
      const ok = await fallbackIPLocation();
      if (!ok) alert("Não foi possível obter sua localização.");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const ok = await processCoords(latitude, longitude);
        if (!ok) await fallbackIPLocation();
        setIsLocating(false);
      },
      (highAccErr) => {
        console.warn("GPS alta precisão falhou, tentando triangulação:", highAccErr.message);
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude, longitude } = pos.coords;
            const ok = await processCoords(latitude, longitude);
            if (!ok) await fallbackIPLocation();
            setIsLocating(false);
          },
          async () => {
            const ok = await fallbackIPLocation();
            if (!ok) alert("Não foi possível obter sua localização. Verifique as permissões.");
            setIsLocating(false);
          },
          { enableHighAccuracy: false, timeout: 4000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 15000 }
    );
  };

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

    if (!vehicle && !customConsumption) {
      setErrorMessage("Por favor, selecione o modelo do seu veículo antes de calcular.");
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
    <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
      {/* Cabeçalho Compacto */}
      <div className="pb-2 mb-2 border-b border-slate-100 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-none">
            Planejamento de Rota
          </h1>
          <p className="text-[10px] text-slate-500 mt-0.5 leading-none">
            Combustível e pedágios automáticos
          </p>
        </div>

        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={isLocating}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-md text-[10px] font-bold shadow-sm transition-colors cursor-pointer shrink-0"
          title="Usar localização atual como ponto de partida"
        >
          {isLocating ? (
            <Loader2 className="w-3 h-3 animate-spin text-white" />
          ) : (
            <Navigation className="w-3 h-3 text-white fill-white" />
          )}
          <span>SEU LOCAL</span>
        </button>
      </div>

      {/* Conteúdo com Scroll Suave Interno */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2 scrollbar-thin scrollbar-thumb-slate-200">
        {/* Inputs de Origem e Destino com botão de inverter na lateral */}
        <div className="flex items-stretch gap-1.5 relative">
          <div className="flex-1 space-y-1">
            <AddressAutocomplete
              label="Origem"
              placeholder="Ponto de partida..."
              value={origin}
              onChange={setOrigin}
            />
            <AddressAutocomplete
              label="Destino"
              placeholder="Destino final..."
              value={destination}
              onChange={setDestination}
            />
          </div>

          <button
            type="button"
            onClick={handleSwapPoints}
            className="w-8 shrink-0 mt-5 flex items-center justify-center bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-500 hover:text-slate-800 rounded-lg border border-slate-200 shadow-sm transition-all"
            title="Inverter origem e destino"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
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
          <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-1.5 text-xs text-amber-900">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="font-medium text-[11px]">{errorMessage}</span>
          </div>
        )}

        {/* Botão de Ação Principal */}
        <button
          type="button"
          onClick={handleCalculateRoute}
          disabled={isLoading || !origin || !destination || (!vehicle && !customConsumption)}
          className="w-full h-8 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99]"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              <span>Calculando rota...</span>
            </>
          ) : (
            <>
              <Navigation className="w-3 h-3" />
              <span>Calcular Rota & Custos</span>
            </>
          )}
        </button>

        {/* Exibição do Resumo quando a rota estiver calculada */}
        {routeResult && (
          <div className="pt-1.5 border-t border-slate-200">
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
