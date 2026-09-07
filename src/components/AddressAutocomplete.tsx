"use client";

import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Navigation, Loader2, X, Building2 } from "lucide-react";
import { LocationPoint } from "@/types";
import { searchAddress, reverseGeocode } from "@/lib/services/photon";

interface AddressAutocompleteProps {
  label: string;
  placeholder: string;
  value: LocationPoint | null;
  onChange: (loc: LocationPoint | null) => void;
  showCurrentLocationButton?: boolean;
}

export function AddressAutocomplete({
  label,
  placeholder,
  value,
  onChange,
  showCurrentLocationButton = false,
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value?.name || "");
  const [suggestions, setSuggestions] = useState<LocationPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (value) {
      setInputValue(value.name);
    } else {
      setInputValue("");
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputValue(text);
    setSelectedIndex(-1);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (text.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchAddress(text);
        setSuggestions(results);
        setIsOpen(results.length > 0);
      } catch (err) {
        console.error("Erro no autocomplete:", err);
      } finally {
        setIsLoading(false);
      }
    }, 200);
  };

  const handleSelect = (item: LocationPoint) => {
    setInputValue(item.name);
    setIsOpen(false);
    setSuggestions([]);
    onChange(item);
  };

  const handleClear = () => {
    setInputValue("");
    setSuggestions([]);
    setIsOpen(false);
    onChange(null);
  };

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
              setInputValue(loc.name);
              onChange(loc);
              return true;
            } else if (data.city) {
              const fallbackLoc: LocationPoint = {
                name: `${data.city}${data.region ? ` - ${data.region}` : ""}`,
                lat,
                lng,
                city: data.city,
                state: data.region,
              };
              setInputValue(fallbackLoc.name);
              onChange(fallbackLoc);
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
          setInputValue(loc.name);
          onChange(loc);
          return true;
        }
      } catch (err) {
        console.error("Erro ao obter endereço do local:", err);
      }
      return false;
    };

    if (!navigator.geolocation) {
      const ok = await fallbackIPLocation();
      if (!ok) {
        alert("Não foi possível obter sua localização.");
      }
      setIsLocating(false);
      return;
    }

    // 1. Tentar GPS de Alta Precisão (hardware/satélite/Wi-Fi detalhado)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const ok = await processCoords(latitude, longitude);
        if (!ok) await fallbackIPLocation();
        setIsLocating(false);
      },
      (highAccErr) => {
        console.warn("GPS alta precisão falhou, tentando triangulação de rede:", highAccErr.message);
        // 2. Tentar modo padrão (triangulação de rede rápida)
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude, longitude } = pos.coords;
            const ok = await processCoords(latitude, longitude);
            if (!ok) await fallbackIPLocation();
            setIsLocating(false);
          },
          async (stdErr) => {
            console.warn("GPS padrão falhou, tentando localização por IP:", stdErr.message);
            const ok = await fallbackIPLocation();
            if (!ok) {
              alert("Não foi possível obter sua localização. Verifique as permissões do navegador.");
            }
            setIsLocating(false);
          },
          { enableHighAccuracy: false, timeout: 4000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 15000 }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[selectedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="flex items-center justify-between mb-0.5">
        <label className="block text-[11px] font-semibold text-slate-700">
          {label}
        </label>
        {showCurrentLocationButton && (
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={isLocating}
            className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded transition-colors border border-slate-200/80"
            title="Usar localização atual"
          >
            {isLocating ? (
              <Loader2 className="w-2.5 h-2.5 animate-spin text-slate-700" />
            ) : (
              <Navigation className="w-2.5 h-2.5 text-slate-500" />
            )}
            <span>Seu local</span>
          </button>
        )}
      </div>

      <div className="relative flex items-center">
        <div className="absolute left-2.5 text-slate-400 pointer-events-none">
          {isLoading ? (
            <Loader2 className="w-3 h-3 animate-spin text-slate-600" />
          ) : (
            <Search className="w-3 h-3" />
          )}
        </div>

        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full h-8 pl-7 pr-6 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all shadow-sm"
        />

        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Dropdown de sugestões limitadas ao Brasil */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1.5 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto divide-y divide-slate-100">
          <div className="px-3.5 py-1.5 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>Sugestões no Brasil</span>
            <span className="text-[10px] text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
              {suggestions.length} encontrados
            </span>
          </div>

          {suggestions.map((item, idx) => (
            <button
              key={`${item.lat}-${item.lng}-${idx}`}
              type="button"
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setSelectedIndex(idx)}
              className={`w-full text-left px-3.5 py-2.5 flex items-start gap-2.5 transition-colors ${
                idx === selectedIndex ? "bg-emerald-50 text-emerald-950" : "hover:bg-slate-50 text-slate-800"
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {item.city && !item.name.includes(",") ? (
                  <Building2 className={`w-4 h-4 ${idx === selectedIndex ? "text-emerald-600" : "text-slate-400"}`} />
                ) : (
                  <MapPin className={`w-4 h-4 ${idx === selectedIndex ? "text-emerald-600" : "text-slate-400"}`} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate leading-tight">{item.name}</p>
                {(item.city || item.state) && (
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {[item.city, item.state].filter(Boolean).join(" - ")}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
