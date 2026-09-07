"use client";

import { useState, useEffect, useRef } from "react";
import { Car, Search, ChevronDown, Check, Sliders, X, Loader2 } from "lucide-react";
import { Vehicle } from "@/types";
import { triggerPixelEvent } from "./PixelTracker";

interface VehicleSelectorProps {
  selectedVehicle: Vehicle | null;
  onSelectVehicle: (v: Vehicle | null) => void;
  customConsumption: number | undefined;
  onChangeCustomConsumption: (val: number | undefined) => void;
  fuelType: 'gasolina' | 'etanol' | 'diesel';
}

export function VehicleSelector({
  selectedVehicle,
  onSelectVehicle,
  customConsumption,
  onChangeCustomConsumption,
  fuelType,
}: VehicleSelectorProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isManualConsumption, setIsManualConsumption] = useState(false);
  const [manualValue, setManualValue] = useState<string>(customConsumption?.toString() || "");
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Carregar lista inicial de veículos populares
  useEffect(() => {
    async function loadInitial() {
      try {
        const res = await fetch("/api/vehicles");
        if (res.ok) {
          const data = await res.json();
          setVehicles(data.vehicles || []);
        }
      } catch (err) {
        console.error("Erro ao carregar veículos:", err);
      }
    }
    loadInitial();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setSearchQuery(text);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    setIsLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/vehicles?q=${encodeURIComponent(text.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setVehicles(data.vehicles || []);
        }
      } catch (err) {
        console.error("Erro na busca de veículos:", err);
      } finally {
        setIsLoading(false);
      }
    }, 180);
  };

  const handleSelect = (v: Vehicle) => {
    onSelectVehicle(v);
    setIsOpen(false);
    setIsManualConsumption(false);
    onChangeCustomConsumption(undefined);

    // Disparar pixel com os metadados do veículo selecionado
    triggerPixelEvent("SelectVehicle", {
      vehicle_id: v.id,
      vehicle_brand: v.brand,
      vehicle_model: v.model,
      vehicle_category: v.category || "Carro",
      vehicle_fuel_type: v.fuel_type || "Flex",
    });
  };

  const handleToggleManual = (checked: boolean) => {
    setIsManualConsumption(checked);
    if (!checked) {
      onChangeCustomConsumption(undefined);
    } else {
      const val = parseFloat(manualValue);
      if (!isNaN(val) && val > 0) {
        onChangeCustomConsumption(val);
      }
    }
  };

  const handleManualValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value.replace(",", ".");
    setManualValue(text);
    const val = parseFloat(text);
    if (!isNaN(val) && val > 0) {
      onChangeCustomConsumption(val);
    }
  };

  const getSelectedVehicleConsumption = () => {
    if (!selectedVehicle) return 12.0;
    if (fuelType === "gasolina") {
      return selectedVehicle.consumption_highway_gasoline || selectedVehicle.consumption_city_gasoline || 12.0;
    }
    if (fuelType === "etanol") {
      return selectedVehicle.consumption_highway_ethanol || selectedVehicle.consumption_city_ethanol || 8.5;
    }
    if (fuelType === "diesel") {
      return selectedVehicle.consumption_highway_diesel || selectedVehicle.consumption_city_diesel || 10.5;
    }
    return 12.0;
  };

  return (
    <div className="w-full space-y-3" ref={containerRef}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Car className="w-4 h-4 text-emerald-600" />
          <span>Veículo & Consumo</span>
        </label>
      </div>

      {/* Botão de seleção de veículo */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full text-left px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all flex items-center justify-between shadow-sm"
        >
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
              <Car className="w-4 h-4" />
            </div>
            <div className="truncate">
              {selectedVehicle ? (
                <div>
                  <p className="font-bold text-slate-900 truncate">
                    {selectedVehicle.brand} {selectedVehicle.model}
                  </p>
                  <p className="text-[11px] text-slate-500">{selectedVehicle.fuel_type || "Flex"}</p>
                </div>
              ) : (
                <p className="text-slate-500 font-medium">Buscar modelo do carro (ex: Prisma, Civic, Onix, Gol)...</p>
              )}
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {/* Dropdown de Busca em Tempo Real nos 5.700+ veículos */}
        {isOpen && (
          <div className="absolute z-50 mt-1.5 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl p-3 space-y-2.5 max-h-80 overflow-hidden flex flex-col">
            {/* Input de Busca */}
            <div className="relative flex items-center shrink-0">
              {isLoading ? (
                <Loader2 className="absolute left-3 w-4 h-4 text-emerald-600 animate-spin" />
              ) : (
                <Search className="absolute left-3 w-4 h-4 text-slate-400" />
              )}
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Digite modelo e ano (ex: Clio 2008, Prisma 2012, Civic 2015, Onix)..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    fetch("/api/vehicles").then((r) => r.json()).then((d) => setVehicles(d.vehicles || []));
                  }}
                  className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Lista de Resultados */}
            <div className="overflow-y-auto flex-1 space-y-1 pr-1 divide-y divide-slate-100">
              {vehicles.length === 0 && !isLoading ? (
                <p className="text-center py-6 text-xs text-slate-500">Nenhum veículo encontrado para &quot;{searchQuery}&quot;.</p>
              ) : (
                vehicles.map((v) => {
                  const isSelected = selectedVehicle?.id === v.id || 
                    (selectedVehicle?.model === v.model && selectedVehicle?.brand === v.brand && selectedVehicle?.year === v.year);

                  return (
                    <button
                      key={`${v.id}-${v.year || ''}`}
                      type="button"
                      onClick={() => handleSelect(v)}
                      className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between transition-colors ${
                        isSelected ? "bg-emerald-50 text-emerald-950" : "hover:bg-slate-50 text-slate-800"
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-sm text-slate-900">
                            {v.brand} {v.model}
                          </span>
                          {v.year && (
                            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                              {v.year}
                            </span>
                          )}
                        </div>

                        {/* Dados de Consumo */}
                        <div className="flex items-center gap-2.5 mt-1 text-[11px] text-slate-500">
                          {v.consumption_highway_gasoline && (
                            <span>Estrada: <strong className="text-emerald-700">{v.consumption_highway_gasoline} km/l</strong> (Gas)</span>
                          )}
                          {v.consumption_highway_ethanol && (
                            <span>| <strong className="text-amber-700">{v.consumption_highway_ethanol} km/l</strong> (Eta)</span>
                          )}
                          {v.consumption_highway_diesel && (
                            <span>| <strong className="text-blue-700">{v.consumption_highway_diesel} km/l</strong> (Diesel)</span>
                          )}
                          {v.consumption_city_gasoline && !v.consumption_highway_gasoline && (
                            <span>Cidade: <strong className="text-emerald-700">{v.consumption_city_gasoline} km/l</strong></span>
                          )}
                        </div>
                      </div>

                      {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Ajuste manual de consumo */}
      <div className="pt-1 flex items-center justify-between">
        <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600">
          <input
            type="checkbox"
            checked={isManualConsumption}
            onChange={(e) => handleToggleManual(e.target.checked)}
            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
          />
          <span className="flex items-center gap-1">
            <Sliders className="w-3 h-3 text-slate-500" />
            Editar consumo manualmente
          </span>
        </label>

        {isManualConsumption ? (
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={manualValue}
              onChange={handleManualValueChange}
              placeholder="ex: 13.5"
              className="w-16 px-2 py-1 bg-white border border-emerald-400 rounded-lg text-xs font-bold text-slate-900 text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <span className="text-xs font-medium text-slate-500">km/l</span>
          </div>
        ) : (
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
            {getSelectedVehicleConsumption().toFixed(1).replace(".", ",")} km/l (Estrada)
          </span>
        )}
      </div>
    </div>
  );
}
