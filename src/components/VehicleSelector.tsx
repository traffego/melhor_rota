"use client";

import { useState, useEffect } from "react";
import { Car, Fuel, Sliders, Check, Search, ChevronDown } from "lucide-react";
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
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [isOpen, setIsOpen] = useState(false);
  const [isManualConsumption, setIsManualConsumption] = useState(false);
  const [manualValue, setManualValue] = useState<string>(customConsumption?.toString() || "");

  useEffect(() => {
    async function loadVehicles() {
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
    loadVehicles();
  }, []);

  const brands = Array.from(new Set(vehicles.map((v) => v.brand))).sort();

  const filteredVehicles = vehicles.filter((v) => {
    const matchesBrand = selectedBrand === "all" || v.brand === selectedBrand;
    const matchesQuery =
      searchQuery.trim() === "" ||
      `${v.brand} ${v.model} ${v.version || ""}`.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBrand && matchesQuery;
  });

  const handleSelect = (v: Vehicle) => {
    onSelectVehicle(v);
    setIsOpen(false);
    setIsManualConsumption(false);
    onChangeCustomConsumption(undefined);

    // Disparar pixel de remarketing com base no carro escolhido!
    triggerPixelEvent("SelectVehicle", {
      vehicle_id: v.id,
      vehicle_brand: v.brand,
      vehicle_model: v.model,
      vehicle_category: v.category || "Carro",
      vehicle_year: v.year || 2024,
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

  // Obter consumo padrão estimado baseado no combustível selecionado
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
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Car className="w-4 h-4 text-emerald-600" />
          <span>Veículo & Consumo Médio</span>
        </label>
        <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
          Tabela Inmetro PBEV
        </span>
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
                <p className="font-bold text-slate-900 truncate">
                  {selectedVehicle.brand} {selectedVehicle.model}{" "}
                  <span className="text-xs font-normal text-slate-500">
                    {selectedVehicle.version ? `(${selectedVehicle.version})` : ""}
                  </span>
                </p>
              ) : (
                <p className="text-slate-500 font-medium">Selecione seu modelo de carro...</p>
              )}
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {/* Modal/Dropdown de Seleção */}
        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl p-3 space-y-2 max-h-96 overflow-hidden flex flex-col">
            {/* Filtros e Busca */}
            <div className="space-y-2 shrink-0">
              <div className="relative flex items-center">
                <Search className="absolute left-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar modelo ou marca (ex: Onix, Polo, Corolla)..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Pílulas de Marcas */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setSelectedBrand("all")}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 transition-colors ${
                    selectedBrand === "all"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Todas
                </button>
                {brands.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setSelectedBrand(b)}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 transition-colors ${
                      selectedBrand === b
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de Carros */}
            <div className="overflow-y-auto flex-1 space-y-1.5 pr-1 divide-y divide-slate-100">
              {filteredVehicles.length === 0 ? (
                <p className="text-center text-xs text-slate-500 py-6">Nenhum veículo encontrado.</p>
              ) : (
                filteredVehicles.map((v) => {
                  const isSelected = selectedVehicle?.model === v.model && selectedVehicle?.brand === v.brand;
                  return (
                    <button
                      key={`${v.brand}-${v.model}-${v.version || ""}`}
                      type="button"
                      onClick={() => handleSelect(v)}
                      className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between transition-colors ${
                        isSelected ? "bg-emerald-50 text-emerald-950" : "hover:bg-slate-50 text-slate-800"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{v.brand} {v.model}</span>
                          {v.category && (
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                              {v.category}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate">{v.version || "Versão Padrão"} - {v.fuel_type}</p>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-600">
                          {v.consumption_highway_gasoline && (
                            <span>Estrada: <strong>{v.consumption_highway_gasoline} km/l</strong> (Gas)</span>
                          )}
                          {v.consumption_highway_ethanol && (
                            <span>| <strong>{v.consumption_highway_ethanol} km/l</strong> (Eta)</span>
                          )}
                          {v.consumption_highway_diesel && (
                            <span>| <strong>{v.consumption_highway_diesel} km/l</strong> (Diesel)</span>
                          )}
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />}
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
