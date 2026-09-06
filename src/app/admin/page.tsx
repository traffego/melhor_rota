"use client";

import { useState, useEffect } from "react";
import { 
  Shield, 
  Target, 
  Key, 
  BarChart3, 
  Car, 
  Fuel, 
  Save, 
  CheckCircle2, 
  Loader2, 
  ExternalLink,
  History,
  TrendingUp
} from "lucide-react";
import { PixelSetting, Vehicle, FuelPrice } from "@/types";
import { formatCurrency, formatDistance, formatDuration } from "@/lib/utils";

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<"pixels" | "stats" | "vehicles" | "fuels">("pixels");
  const [pixels, setPixels] = useState<PixelSetting[]>([
    { id: "1", platform: "meta", name: "Meta Pixel (Facebook/Instagram Ads)", pixel_id: "", is_active: false },
    { id: "2", platform: "gtm", name: "Google Tag Manager (GTM)", pixel_id: "", is_active: false },
    { id: "3", platform: "tiktok", name: "TikTok Pixel", pixel_id: "", is_active: false },
    { id: "4", platform: "gads", name: "Google Ads Conversion Tag", pixel_id: "", is_active: false },
  ]);
  const [stats, setStats] = useState<{ totalRoutes: number; totalVehicles: number; recentRoutes: any[] }>({
    totalRoutes: 0,
    totalVehicles: 0,
    recentRoutes: [],
  });
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [fuels, setFuels] = useState<FuelPrice[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    // Carregar pixels do admin
    async function loadAdminData() {
      try {
        const [pixelRes, statsRes, vehRes, fuelRes] = await Promise.all([
          fetch("/api/admin/pixels"),
          fetch("/api/admin/stats"),
          fetch("/api/vehicles"),
          fetch("/api/fuel-prices"),
        ]);

        if (pixelRes.ok) {
          const data = await pixelRes.json();
          if (data.pixels && data.pixels.length > 0) {
            // Mesclar com plataformas padrão
            setPixels((prev) =>
              prev.map((p) => {
                const found = data.pixels.find((dp: any) => dp.platform === p.platform);
                return found ? { ...p, ...found } : p;
              })
            );
          }
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        if (vehRes.ok) {
          const vehData = await vehRes.json();
          setVehicles(vehData.vehicles || []);
        }

        if (fuelRes.ok) {
          const fuelData = await fuelRes.json();
          setFuels(fuelData.prices || []);
        }
      } catch (err) {
        console.error("Erro ao carregar dados do admin:", err);
      }
    }
    loadAdminData();
  }, []);

  const handlePixelChange = (platform: string, field: keyof PixelSetting, value: any) => {
    setPixels((prev) =>
      prev.map((p) => (p.platform === platform ? { ...p, [field]: value } : p))
    );
  };

  const handleSavePixels = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      for (const p of pixels) {
        await fetch("/api/admin/pixels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(p),
        });
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Erro ao salvar pixels:", err);
      alert("Erro ao salvar configurações de pixels.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Cabeçalho do Admin */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Painel Administrativo</h1>
            <p className="text-xs text-slate-500">
              Gerencie Pixels de Remarketing, APIs, Veículos e Histórico de Rotas
            </p>
          </div>
        </div>

        {/* Abas */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("pixels")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === "pixels"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Pixels & Rastreamento</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("stats")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === "stats"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Métricas & Rotas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("vehicles")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === "vehicles"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Car className="w-4 h-4" />
            <span>Veículos Inmetro</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("fuels")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === "fuels"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Fuel className="w-4 h-4" />
            <span>Preços ANP</span>
          </button>
        </div>
      </div>

      {/* 1. ABA DE PIXELS */}
      {activeTab === "pixels" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Pixels de Anúncios & Remarketing
              </h2>
              <p className="text-xs text-slate-500">
                Configure os identificadores dos pixels para rastrear usuários de acordo com o modelo de carro escolhido.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSavePixels}
              disabled={isSaving}
              className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saveSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Salvo com Sucesso!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Salvar Configurações</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pixels.map((p) => (
              <div
                key={p.platform}
                className="bg-slate-50/90 border border-slate-200 p-5 rounded-2xl space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{p.name}</h3>
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                      {p.platform}
                    </span>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={p.is_active}
                      onChange={(e) => handlePixelChange(p.platform, "is_active", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    ID do Pixel / Tag ID
                  </label>
                  <input
                    type="text"
                    value={p.pixel_id}
                    onChange={(e) => handlePixelChange(p.platform, "pixel_id", e.target.value)}
                    placeholder={
                      p.platform === "meta" ? "ex: 123456789012345" :
                      p.platform === "gtm" ? "ex: GTM-XXXXXXX" :
                      p.platform === "tiktok" ? "ex: C1234567890ABCDE" :
                      "ex: AW-123456789"
                    }
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-800">Eventos rastreados automaticamente:</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-slate-500">
                    <li><code>SelectVehicle</code> (marca, modelo, categoria do carro)</li>
                    <li><code>CalculateRoute</code> (origem, destino, distância, valor total)</li>
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. ABA DE MÉTRICAS */}
      {activeTab === "stats" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-slate-500">Total de Rotas Calculadas</span>
              <p className="text-3xl font-black text-slate-900">{stats.totalRoutes}</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-slate-500">Modelos de Veículos</span>
              <p className="text-3xl font-black text-emerald-600">{stats.totalVehicles}</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-slate-500">Status dos Pixels</span>
              <p className="text-3xl font-black text-indigo-600">
                {pixels.filter((p) => p.is_active).length} Ativos
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" />
              <span>Últimas Rotas Calculadas</span>
            </h2>

            {stats.recentRoutes.length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-8">
                Nenhuma rota registrada ainda.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="pb-3">Origem</th>
                      <th className="pb-3">Destino</th>
                      <th className="pb-3">Veículo</th>
                      <th className="pb-3">Distância</th>
                      <th className="pb-3">Pedágios</th>
                      <th className="pb-3">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats.recentRoutes.map((r: any) => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="py-3 font-semibold text-slate-900 max-w-[150px] truncate">{r.origin_name}</td>
                        <td className="py-3 font-semibold text-slate-900 max-w-[150px] truncate">{r.destination_name}</td>
                        <td className="py-3 text-slate-600">{r.vehicle_name}</td>
                        <td className="py-3 text-slate-600">{formatDistance(r.distance_km || 0)}</td>
                        <td className="py-3 font-semibold text-amber-700">{formatCurrency(r.toll_cost || 0)}</td>
                        <td className="py-3 font-bold text-emerald-700">{formatCurrency(r.total_cost || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. ABA DE VEÍCULOS */}
      {activeTab === "vehicles" && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Catálogo de Veículos (Inmetro PBEV)</h2>
              <p className="text-xs text-slate-500">Lista com dados oficiais de consumo rodoviário e urbano</p>
            </div>
            <span className="text-xs font-bold bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
              {vehicles.length} Veículos Cadastrados
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase">
                  <th className="pb-3">Marca</th>
                  <th className="pb-3">Modelo</th>
                  <th className="pb-3">Versão</th>
                  <th className="pb-3">Categoria</th>
                  <th className="pb-3">Gasolina (Estrada)</th>
                  <th className="pb-3">Etanol (Estrada)</th>
                  <th className="pb-3">Diesel (Estrada)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vehicles.map((v, i) => (
                  <tr key={v.id || i} className="hover:bg-slate-50">
                    <td className="py-2.5 font-bold text-slate-900">{v.brand}</td>
                    <td className="py-2.5 text-slate-800">{v.model}</td>
                    <td className="py-2.5 text-slate-500">{v.version || "-"}</td>
                    <td className="py-2.5"><span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] uppercase font-bold">{v.category}</span></td>
                    <td className="py-2.5 font-semibold text-emerald-700">{v.consumption_highway_gasoline ? `${v.consumption_highway_gasoline} km/l` : "-"}</td>
                    <td className="py-2.5 font-semibold text-amber-700">{v.consumption_highway_ethanol ? `${v.consumption_highway_ethanol} km/l` : "-"}</td>
                    <td className="py-2.5 font-semibold text-blue-700">{v.consumption_highway_diesel ? `${v.consumption_highway_diesel} km/l` : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. ABA DE PREÇOS ANP */}
      {activeTab === "fuels" && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Preços Médios de Combustível (ANP)</h2>
            <p className="text-xs text-slate-500">Valores de referência por estado para cálculo da viagem</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {fuels.map((f) => (
              <div key={f.state_uf} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{f.state_name} ({f.state_uf})</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  <div className="bg-white p-2 rounded-xl border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-500 block">Gasolina</span>
                    <strong className="text-emerald-700">R$ {f.gasoline_avg.toFixed(2)}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-500 block">Etanol</span>
                    <strong className="text-amber-700">R$ {f.ethanol_avg.toFixed(2)}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-500 block">Diesel</span>
                    <strong className="text-blue-700">R$ {f.diesel_avg.toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
