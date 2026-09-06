"use client";

import { useState, useEffect } from "react";
import { Fuel, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { FuelPrice } from "@/types";

interface FuelCalculatorProps {
  fuelType: 'gasolina' | 'etanol' | 'diesel';
  onChangeFuelType: (type: 'gasolina' | 'etanol' | 'diesel') => void;
  fuelPrice: number;
  onChangeFuelPrice: (price: number) => void;
  ethanolPrice: number;
  onChangeEthanolPrice: (price: number) => void;
}

export function FuelCalculator({
  fuelType,
  onChangeFuelType,
  fuelPrice,
  onChangeFuelPrice,
  ethanolPrice,
  onChangeEthanolPrice,
}: FuelCalculatorProps) {
  const [fuelPrices, setFuelPrices] = useState<FuelPrice[]>([]);
  const [selectedUf, setSelectedUf] = useState<string>("BR");

  useEffect(() => {
    async function loadPrices() {
      try {
        const res = await fetch("/api/fuel-prices");
        if (res.ok) {
          const data = await res.json();
          const list: FuelPrice[] = data.prices || [];
          setFuelPrices(list);

          const defaultPrice = list.find((p) => p.state_uf === "BR") || list[0];
          if (defaultPrice) {
            if (fuelType === "gasolina") onChangeFuelPrice(defaultPrice.gasoline_avg);
            if (fuelType === "etanol") onChangeFuelPrice(defaultPrice.ethanol_avg);
            if (fuelType === "diesel") onChangeFuelPrice(defaultPrice.diesel_avg);
            onChangeEthanolPrice(defaultPrice.ethanol_avg);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar preços:", err);
      }
    }
    loadPrices();
  }, []);

  const handleUfChange = (uf: string) => {
    setSelectedUf(uf);
    const found = fuelPrices.find((p) => p.state_uf === uf);
    if (found) {
      if (fuelType === "gasolina") onChangeFuelPrice(found.gasoline_avg);
      if (fuelType === "etanol") onChangeFuelPrice(found.ethanol_avg);
      if (fuelType === "diesel") onChangeFuelPrice(found.diesel_avg);
      onChangeEthanolPrice(found.ethanol_avg);
    }
  };

  const handleTypeChange = (type: 'gasolina' | 'etanol' | 'diesel') => {
    onChangeFuelType(type);
    const found = fuelPrices.find((p) => p.state_uf === selectedUf) || fuelPrices[0];
    if (found) {
      if (type === "gasolina") onChangeFuelPrice(found.gasoline_avg);
      if (type === "etanol") onChangeFuelPrice(found.ethanol_avg);
      if (type === "diesel") onChangeFuelPrice(found.diesel_avg);
    }
  };

  // Comparador 70% Etanol vs Gasolina
  const currentGasolinePrice = fuelType === "gasolina" ? fuelPrice : 6.05;
  const currentEthanolPrice = ethanolPrice > 0 ? ethanolPrice : (fuelType === "etanol" ? fuelPrice : 4.09);
  const ratio = (currentEthanolPrice / Math.max(currentGasolinePrice, 0.01)) * 100;
  const isEthanolAdvantageous = ratio <= 70.0;

  return (
    <div className="w-full space-y-3 bg-slate-50/80 border border-slate-200 p-3.5 rounded-2xl">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Fuel className="w-4 h-4 text-emerald-600" />
          <span>Combustível & Preço do Litro</span>
        </label>
        
        {/* Seletor de Estado / ANP */}
        <select
          value={selectedUf}
          onChange={(e) => handleUfChange(e.target.value)}
          className="text-xs font-semibold bg-white border border-slate-300 text-slate-700 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          {fuelPrices.map((p) => (
            <option key={p.state_uf} value={p.state_uf}>
              {p.state_uf === "BR" ? "Média ANP (Brasil)" : `ANP (${p.state_uf})`}
            </option>
          ))}
        </select>
      </div>

      {/* Seletor Tipo de Combustível */}
      <div className="grid grid-cols-3 gap-2">
        {(['gasolina', 'etanol', 'diesel'] as const).map((type) => {
          const isActive = fuelType === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => handleTypeChange(type)}
              className={`py-2 px-3 rounded-xl text-xs font-bold capitalize transition-all border ${
                isActive
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {type}
            </button>
          );
        })}
      </div>

      {/* Input de Preço por Litro Customizável */}
      <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
        <span className="text-xs font-semibold text-slate-600">
          Preço do litro ({fuelType}):
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-500">R$</span>
          <input
            type="number"
            step="0.01"
            min="0.50"
            max="25.00"
            value={fuelPrice || ""}
            onChange={(e) => onChangeFuelPrice(parseFloat(e.target.value) || 0)}
            className="w-20 px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 text-right focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Comparador inteligente Etanol x Gasolina */}
      {fuelType === "gasolina" && (
        <div className="pt-1">
          <div className={`p-2.5 rounded-xl text-xs border flex items-start gap-2 ${
            isEthanolAdvantageous
              ? "bg-amber-50 border-amber-200 text-amber-900"
              : "bg-emerald-50 border-emerald-200 text-emerald-900"
          }`}>
            {isEthanolAdvantageous ? (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 leading-tight">
              <p className="font-bold">
                {isEthanolAdvantageous
                  ? `Etanol está valendo mais a pena (${ratio.toFixed(0)}% da Gasolina)`
                  : `Gasolina é a mais vantajosa (${ratio.toFixed(0)}% proporção)`}
              </p>
              <p className="text-[11px] opacity-80 mt-0.5">
                (Regra dos 70%: Etanol a R$ {currentEthanolPrice.toFixed(2)} vs Gasolina a R$ {currentGasolinePrice.toFixed(2)})
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
