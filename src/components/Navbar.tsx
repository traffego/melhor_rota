import Link from "next/link";
import { Compass, Shield, Fuel } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Compass className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900 bg-gradient-to-r from-slate-900 via-emerald-800 to-teal-700 bg-clip-text text-transparent">
                Melhor Rota
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Calculadora & Pedágios
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-emerald-600 transition-colors px-3 py-2 rounded-lg hover:bg-slate-100"
            >
              <Fuel className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Calcular Rota</span>
            </Link>

            <Link
              href="/admin"
              className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-lg transition-colors border border-slate-200 shadow-sm"
            >
              <Shield className="w-4 h-4 text-indigo-600" />
              <span>Painel Admin</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
