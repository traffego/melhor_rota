export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  version?: string;
  year?: number;
  category?: string;
  fuel_type?: string;
  consumption_city_gasoline?: number | null;
  consumption_highway_gasoline?: number | null;
  consumption_city_ethanol?: number | null;
  consumption_highway_ethanol?: number | null;
  consumption_city_diesel?: number | null;
  consumption_highway_diesel?: number | null;
}

export interface FuelPrice {
  id?: string;
  state_uf: string;
  state_name: string;
  gasoline_avg: number;
  ethanol_avg: number;
  diesel_avg: number;
  updated_at?: string;
}

export interface PixelSetting {
  id: string;
  platform: 'meta' | 'gtm' | 'tiktok' | 'gads';
  name: string;
  pixel_id: string;
  is_active: boolean;
  conversion_token?: string;
  custom_events_config?: {
    on_vehicle_select?: boolean;
    on_route_calculate?: boolean;
    [key: string]: boolean | undefined;
  };
}

export interface LocationPoint {
  name: string;
  lat: number;
  lng: number;
  city?: string;
  state?: string;
}

export interface TollGate {
  id: string;
  name: string;
  lat: number;
  lng: number;
  cost: number;
  road?: string;
}

export interface RouteResult {
  origin: LocationPoint;
  destination: LocationPoint;
  distanceKm: number;
  durationMinutes: number;
  geometry: [number, number][]; // [lat, lng] array
  tolls: TollGate[];
  totalTollCost: number;
  fuelCost: number;
  litersNeeded: number;
  totalCost: number;
  isRoundTrip: boolean;
  fuelType: 'gasolina' | 'etanol' | 'diesel';
  fuelPricePerLiter: number;
  consumptionKmPerLiter: number;
  ethanolComparison?: {
    ethanolLiters: number;
    ethanolCost: number;
    ethanolTotal: number;
    isEthanolAdvantageous: boolean;
    differencePercentage: number;
  };
}

export interface RouteCalculationParams {
  origin: LocationPoint;
  destination: LocationPoint;
  vehicle: Vehicle | null;
  customConsumption?: number;
  fuelType: 'gasolina' | 'etanol' | 'diesel';
  customFuelPrice?: number;
  isRoundTrip: boolean;
}
