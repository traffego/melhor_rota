import Link from "next/link";
import { Compass, Shield, Fuel } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-black text-sm shadow-sm group-hover:bg-emerald-700 transition-colors">
              <Compass className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-slate-900">
                Melhor Rota
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-semibold rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                Pedágios & Combustível
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-2">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100"
            >
              <Fuel className="w-3.5 h-3.5 text-emerald-600" />
              <span>Calculadora</span>
            </Link>

            <Link
              href="/admin"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors border border-slate-200/80"
            >
              <Shield className="w-3.5 h-3.5 text-slate-500" />
              <span>Painel</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
