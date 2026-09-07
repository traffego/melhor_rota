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
  Info,
  Navigation
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

  const unit = result.fuelType === "gnv" ? "m³" : "L";
  const consumptionUnit = result.fuelType === "gnv" ? "km/m³" : "km/l";

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(`${result.origin.lat},${result.origin.lng}`)}&destination=${encodeURIComponent(`${result.destination.lat},${result.destination.lng}`)}&travelmode=driving`;
  const wazeUrl = `https://waze.com/ul?ll=${result.destination.lat},${result.destination.lng}&navigate=yes`;

  const handleCopy = () => {
    const text = `🚗 *Melhor Rota - Resumo da Viagem*
📍 *Origem:* ${result.origin.name}
🏁 *Destino:* ${result.destination.name}
📏 *Distância:* ${formatDistance(result.distanceKm)} (${isRoundTrip ? "Ida e Volta" : "Apenas Ida"})
⏱️ *Tempo Estimado:* ${formatDuration(result.durationMinutes)}

⛽ *Combustível:* ${result.litersNeeded.toFixed(1)} ${unit} (${result.fuelType.toUpperCase()}) = ${formatCurrency(result.fuelCost)}
🛣️ *Pedágios:* ${formatCurrency(result.totalTollCost)} (${result.tolls.length} praças)
💰 *CUSTO TOTAL:* ${formatCurrency(result.totalCost)}

🗺️ *Google Maps:* ${googleMapsUrl}
🚙 *Waze:* ${wazeUrl}

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

⛽ *Combustível:* ${result.litersNeeded.toFixed(1)} ${unit} = ${formatCurrency(result.fuelCost)}
🛣️ *Pedágios:* ${formatCurrency(result.totalTollCost)}
💰 *CUSTO TOTAL:* ${formatCurrency(result.totalCost)}

🗺️ *Google Maps:* ${googleMapsUrl}
🚙 *Waze:* ${wazeUrl}`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="w-full space-y-3">
      {/* Switch de Ida e Volta */}
      <div className="bg-slate-100/90 p-2.5 rounded-xl flex items-center justify-between border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
            <RotateCcw className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 leading-none">Ida e Volta</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Dobra combustível e pedágios</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onToggleRoundTrip(!isRoundTrip)}
          className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            isRoundTrip ? "bg-emerald-600" : "bg-slate-300"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              isRoundTrip ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Card Principal de Resumo Financeiro */}
      <div className="bg-slate-900 text-white p-4 rounded-xl shadow-sm border border-slate-800 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div>
            <span className="text-[11px] font-medium text-slate-400">
              Custo Total Estimado
            </span>
            <h3 className="text-2xl font-bold text-emerald-400 tracking-tight">
              {formatCurrency(result.totalCost)}
            </h3>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-medium text-slate-400">Distância Total</span>
            <p className="text-base font-semibold text-white">{formatDistance(result.distanceKm)}</p>
          </div>
        </div>

        {/* Grade de Detalhes de Custo */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-800/70 p-2.5 rounded-lg border border-slate-700/50">
            <div className="flex items-center gap-1.5 text-slate-300 font-medium mb-1">
              <Fuel className="w-3.5 h-3.5 text-emerald-400" />
              <span>Combustível</span>
            </div>
            <p className="text-sm font-bold text-white">{formatCurrency(result.fuelCost)}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {result.litersNeeded.toFixed(1)} {unit} ({result.consumptionKmPerLiter.toFixed(1)} {consumptionUnit})
            </p>
          </div>

          <div className="bg-slate-800/70 p-2.5 rounded-lg border border-slate-700/50">
            <div className="flex items-center gap-1.5 text-slate-300 font-medium mb-1">
              <ReceiptText className="w-3.5 h-3.5 text-teal-400" />
              <span>Pedágios</span>
            </div>
            <p className="text-sm font-bold text-white">{formatCurrency(result.totalTollCost)}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {result.tolls.length} {result.tolls.length === 1 ? "praça" : "praças"}
            </p>
          </div>
        </div>

        {/* Tempo e Rota */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Tempo estimado: <strong className="text-slate-200">{formatDuration(result.durationMinutes)}</strong></span>
          </div>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-semibold border border-slate-700">
            {isRoundTrip ? "Ida & Volta" : "Apenas Ida"}
          </span>
        </div>
      </div>

      {/* Lista de Praças de Pedágio */}
      {result.tolls.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
              <ReceiptText className="w-3.5 h-3.5 text-emerald-600" />
              <span>Pedágios ({result.tolls.length})</span>
            </h4>
            <span className="text-xs font-bold text-emerald-700">
              {formatCurrency(result.totalTollCost)}
            </span>
          </div>

          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 divide-y divide-slate-100 text-xs">
            {result.tolls.map((toll, idx) => (
              <div key={toll.id || idx} className="pt-1.5 first:pt-0 flex items-center justify-between">
                <div className="truncate flex-1 pr-2">
                  <p className="font-semibold text-slate-800 text-[11px] truncate">{toll.name}</p>
                  {toll.road && <p className="text-[10px] text-slate-500">{toll.road}</p>}
                </div>
                <span className="font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] shrink-0">
                  {formatCurrency(toll.cost)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botões de Navegação GPS */}
      <div className="space-y-1.5 pt-1">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
          Navegar no Celular / GPS
        </span>
        <div className="grid grid-cols-2 gap-2">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-blue-50 text-slate-800 hover:text-blue-700 rounded-xl text-xs font-bold transition-all border border-slate-200 hover:border-blue-300 shadow-sm"
          >
            <Navigation className="w-3.5 h-3.5 text-blue-600" />
            <span>Google Maps</span>
          </a>

          <a
            href={wazeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-cyan-50 text-slate-800 hover:text-cyan-700 rounded-xl text-xs font-bold transition-all border border-slate-200 hover:border-cyan-300 shadow-sm"
          >
            <Navigation className="w-3.5 h-3.5 text-cyan-500" />
            <span>Waze</span>
          </a>
        </div>
      </div>

      {/* Botões de Ação e Compartilhamento */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors border border-slate-300 shadow-sm"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? "Copiado!" : "Copiar"}</span>
        </button>

        <button
          type="button"
          onClick={handleShareWhatsApp}
          className="flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md shadow-emerald-600/20"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>WhatsApp</span>
        </button>
      </div>
    </div>
  );
}
