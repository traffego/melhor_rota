"use client";

import { useState } from "react";
import { 
  Fuel, 
  ReceiptText, 
  Wallet, 
  Clock, 
  MapPin, 
  RotateCcw, 
  Share2, 
  Copy, 
  Check, 
  DollarSign,
  Info
} from "lucide-react";
import { RouteResult } from "@/types";
import { formatCurrency, formatDistance, formatDuration } from "@/lib/utils";

interface RouteSummaryProps {
  result: RouteResult;
  isRoundTrip: boolean;
  onToggleRoundTrip: (roundTrip: boolean) => void;
}

export function RouteSummary({ result, isRoundTrip, onToggleRoundTrip }: RouteSummaryProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = `🚗 *Melhor Rota - Resumo da Viagem*
📍 *Origem:* ${result.origin.name}
🏁 *Destino:* ${result.destination.name}
📏 *Distância:* ${formatDistance(result.distanceKm)} (${isRoundTrip ? "Ida e Volta" : "Apenas Ida"})
⏱️ *Tempo Estimado:* ${formatDuration(result.durationMinutes)}

⛽ *Combustível:* ${result.litersNeeded.toFixed(1)} L (${result.fuelType}) = ${formatCurrency(result.fuelCost)}
🛣️ *Pedágios:* ${formatCurrency(result.totalTollCost)} (${result.tolls.length} praças)
💰 *CUSTO TOTAL:* ${formatCurrency(result.totalCost)}

Calculado em Melhor Rota.`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = `🚗 *Melhor Rota - Resumo da Viagem*
📍 *Origem:* ${result.origin.name}
🏁 *Destino:* ${result.destination.name}
📏 *Distância:* ${formatDistance(result.distanceKm)} (${isRoundTrip ? "Ida e Volta" : "Apenas Ida"})
⏱️ *Tempo Estimado:* ${formatDuration(result.durationMinutes)}

⛽ *Combustível:* ${result.litersNeeded.toFixed(1)} L = ${formatCurrency(result.fuelCost)}
🛣️ *Pedágios:* ${formatCurrency(result.totalTollCost)}
💰 *CUSTO TOTAL:* ${formatCurrency(result.totalCost)}`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="w-full space-y-4">
      {/* Switch de Ida e Volta */}
      <div className="bg-slate-100/90 p-3 rounded-2xl flex items-center justify-between border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
            <RotateCcw className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">Calcular Ida e Volta</p>
            <p className="text-[11px] text-slate-500">Dobra distância, combustível e pedágios</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onToggleRoundTrip(!isRoundTrip)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            isRoundTrip ? "bg-emerald-600" : "bg-slate-300"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              isRoundTrip ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Card Principal de Resumo Financeiro */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white p-5 rounded-3xl shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <span className="text-[11px] uppercase tracking-wider font-semibold text-emerald-400">
              Custo Total Estimado
            </span>
            <h3 className="text-3xl font-black text-white tracking-tight">
              {formatCurrency(result.totalCost)}
            </h3>
          </div>
          <div className="text-right">
            <span className="text-xs font-medium text-slate-300">Distância Total</span>
            <p className="text-lg font-bold text-emerald-300">{formatDistance(result.distanceKm)}</p>
          </div>
        </div>

        {/* Grade de Detalhes de Custo */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-1">
              <Fuel className="w-4 h-4" />
              <span>Combustível</span>
            </div>
            <p className="text-base font-bold text-white">{formatCurrency(result.fuelCost)}</p>
            <p className="text-[11px] text-slate-300 mt-0.5">
              {result.litersNeeded.toFixed(1)} L ({result.consumptionKmPerLiter.toFixed(1)} km/l)
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
            <div className="flex items-center gap-1.5 text-teal-400 font-semibold mb-1">
              <ReceiptText className="w-4 h-4" />
              <span>Pedágios</span>
            </div>
            <p className="text-base font-bold text-white">{formatCurrency(result.totalTollCost)}</p>
            <p className="text-[11px] text-slate-300 mt-0.5">
              {result.tolls.length} {result.tolls.length === 1 ? "praça" : "praças"}
            </p>
          </div>
        </div>

        {/* Tempo e Rota */}
        <div className="flex items-center justify-between text-xs text-slate-300 pt-1 border-t border-white/10">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Tempo de viagem: <strong>{formatDuration(result.durationMinutes)}</strong></span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
            {isRoundTrip ? "Ida & Volta" : "Apenas Ida"}
          </span>
        </div>
      </div>

      {/* Lista de Praças de Pedágio */}
      {result.tolls.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <ReceiptText className="w-4 h-4 text-emerald-600" />
              <span>Detalhamento dos Pedágios ({result.tolls.length})</span>
            </h4>
            <span className="text-xs font-bold text-emerald-700">
              Total: {formatCurrency(result.totalTollCost)}
            </span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 divide-y divide-slate-100 text-xs">
            {result.tolls.map((toll, idx) => (
              <div key={toll.id || idx} className="pt-2 first:pt-0 flex items-center justify-between">
                <div className="truncate flex-1 pr-2">
                  <p className="font-semibold text-slate-800 truncate">{toll.name}</p>
                  {toll.road && <p className="text-[11px] text-slate-500">{toll.road}</p>}
                </div>
                <span className="font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-lg shrink-0">
                  {formatCurrency(toll.cost)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botões de Ação e Compartilhamento */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors border border-slate-300 shadow-sm"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? "Copiado!" : "Copiar Resumo"}</span>
        </button>

        <button
          type="button"
          onClick={handleShareWhatsApp}
          className="flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md shadow-emerald-600/20"
        >
          <Share2 className="w-4 h-4" />
          <span>WhatsApp</span>
        </button>
      </div>
    </div>
  );
}
