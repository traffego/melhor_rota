import { Vehicle } from "@/types";
import { estimateVehicleConsumption } from "./fipe";

// Base abrangente de modelos, versões e anos mais populares e históricos do Brasil
export const COMPREHENSIVE_VEHICLES: Vehicle[] = [
  // PRISMA
  { id: "prisma-1", brand: "Chevrolet", model: "Prisma", version: "1.0 Joy Flex", year: 2019, category: "Sedan", fuel_type: "Flex", consumption_city_gasoline: 12.9, consumption_highway_gasoline: 15.6, consumption_city_ethanol: 8.7, consumption_highway_ethanol: 10.9 },
  { id: "prisma-2", brand: "Chevrolet", model: "Prisma", version: "1.4 LT Flex MT", year: 2019, category: "Sedan", fuel_type: "Flex", consumption_city_gasoline: 12.5, consumption_highway_gasoline: 15.3, consumption_city_ethanol: 8.5, consumption_highway_ethanol: 10.7 },
  { id: "prisma-3", brand: "Chevrolet", model: "Prisma", version: "1.4 LTZ Flex AT", year: 2019, category: "Sedan", fuel_type: "Flex", consumption_city_gasoline: 11.9, consumption_highway_gasoline: 14.7, consumption_city_ethanol: 8.1, consumption_highway_ethanol: 10.2 },
  { id: "prisma-4", brand: "Chevrolet", model: "Prisma", version: "1.4 Maxx Flex", year: 2012, category: "Sedan", fuel_type: "Flex", consumption_city_gasoline: 11.0, consumption_highway_gasoline: 13.5, consumption_city_ethanol: 7.5, consumption_highway_ethanol: 9.2 },

  // ONIX
  { id: "onix-1", brand: "Chevrolet", model: "Onix", version: "1.0 MT Flex", year: 2024, category: "Hatch", fuel_type: "Flex", consumption_city_gasoline: 13.3, consumption_highway_gasoline: 16.6, consumption_city_ethanol: 9.3, consumption_highway_ethanol: 11.7 },
  { id: "onix-2", brand: "Chevrolet", model: "Onix", version: "1.0 Turbo LT MT", year: 2024, category: "Hatch", fuel_type: "Flex", consumption_city_gasoline: 13.5, consumption_highway_gasoline: 16.0, consumption_city_ethanol: 9.4, consumption_highway_ethanol: 11.2 },
  { id: "onix-3", brand: "Chevrolet", model: "Onix", version: "1.0 Turbo Premier AT", year: 2024, category: "Hatch", fuel_type: "Flex", consumption_city_gasoline: 11.9, consumption_highway_gasoline: 15.1, consumption_city_ethanol: 8.4, consumption_highway_ethanol: 10.4 },
  { id: "onix-4", brand: "Chevrolet", model: "Onix", version: "1.4 LT Flex", year: 2018, category: "Hatch", fuel_type: "Flex", consumption_city_gasoline: 12.5, consumption_highway_gasoline: 14.9, consumption_city_ethanol: 8.6, consumption_highway_ethanol: 10.2 },
  { id: "onix-5", brand: "Chevrolet", model: "Onix Plus", version: "1.0 Turbo Premier AT", year: 2024, category: "Sedan", fuel_type: "Flex", consumption_city_gasoline: 12.3, consumption_highway_gasoline: 15.6, consumption_city_ethanol: 8.6, consumption_highway_ethanol: 10.9 },

  // CORSA / CELTA / ASTRA / VECTRA / CRUZE / TRACKER / S10 / SPIN / MONTANA
  { id: "celta-1", brand: "Chevrolet", model: "Celta", version: "1.0 Life / Spirit / Super Flex", year: 2015, category: "Hatch", fuel_type: "Flex", consumption_city_gasoline: 13.5, consumption_highway_gasoline: 15.0, consumption_city_ethanol: 9.5, consumption_highway_ethanol: 10.7 },
  { id: "corsa-1", brand: "Chevrolet", model: "Corsa", version: "1.0 Joy / Maxx / Premium", year: 2012, category: "Hatch", fuel_type: "Flex", consumption_city_gasoline: 12.6, consumption_highway_gasoline: 14.2, consumption_city_ethanol: 8.8, consumption_highway_ethanol: 9.9 },
  { id: "corsa-2", brand: "Chevrolet", model: "Corsa", version: "1.4 Premium Flex", year: 2012, category: "Hatch", fuel_type: "Flex", consumption_city_gasoline: 11.5, consumption_highway_gasoline: 13.8, consumption_city_ethanol: 7.9, consumption_highway_ethanol: 9.5 },
  { id: "astra-1", brand: "Chevrolet", model: "Astra", version: "2.0 Advantage Flex", year: 2011, category: "Hatch", fuel_type: "Flex", consumption_city_gasoline: 9.8, consumption_highway_gasoline: 12.5, consumption_city_ethanol: 6.8, consumption_highway_ethanol: 8.7 },
  { id: "cruze-1", brand: "Chevrolet", model: "Cruze", version: "1.4 Turbo LTZ AT", year: 2023, category: "Sedan", fuel_type: "Flex", consumption_city_gasoline: 11.1, consumption_highway_gasoline: 14.0, consumption_city_ethanol: 7.6, consumption_highway_ethanol: 9.6 },
  { id: "tracker-1", brand: "Chevrolet", model: "Tracker", version: "1.0 Turbo Premier AT", year: 2024, category: "SUV", fuel_type: "Flex", consumption_city_gasoline: 11.2, consumption_highway_gasoline: 13.4, consumption_city_ethanol: 7.8, consumption_highway_ethanol: 9.6 },
  { id: "tracker-2", brand: "Chevrolet", model: "Tracker", version: "1.2 Turbo Premier AT", year: 2024, category: "SUV", fuel_type: "Flex", consumption_city_gasoline: 10.4, consumption_highway_gasoline: 12.8, consumption_city_ethanol: 7.2, consumption_highway_ethanol: 8.9 },
  { id: "spin-1", brand: "Chevrolet", model: "Spin", version: "1.8 Premier AT", year: 2024, category: "Minivan", fuel_type: "Flex", consumption_city_gasoline: 10.5, consumption_highway_gasoline: 12.8, consumption_city_ethanol: 7.3, consumption_highway_ethanol: 8.9 },
  { id: "montana-1", brand: "Chevrolet", model: "Montana", version: "1.2 Turbo Premier AT", year: 2024, category: "Picape", fuel_type: "Flex", consumption_city_gasoline: 11.1, consumption_highway_gasoline: 13.3, consumption_city_ethanol: 7.7, consumption_highway_ethanol: 9.3 },
  { id: "s10-1", brand: "Chevrolet", model: "S10", version: "2.8 Turbo Diesel 4x4 High Country", year: 2024, category: "Picape", fuel_type: "Diesel", consumption_city_diesel: 9.2, consumption_highway_diesel: 10.6 },

  // FIAT (UNO, PALIO, MOBI, ARGO, CRONOS, STRADA, TORO, PULSE, FASTBACK, SIENA, PUNTO, IDEA)
  { id: "uno-1", brand: "Fiat", model: "Uno", version: "1.0 Attractive / Way Fire", year: 2021, category: "Hatch", fuel_type: "Flex", consumption_city_gasoline: 13.2, consumption_highway_gasoline: 15.2, consumption_city_ethanol: 9.1, consumption_highway_ethanol: 10.6 },
  { id: "uno-2", brand: "Fiat", model: "Uno", version: "1.0 Mille Fire Flex", year: 2013, category: "Hatch", fuel_type: "Flex", consumption_city_gasoline: 12.8, consumption_highway_gasoline: 14.5, consumption_city_ethanol: 8.9, consumption_highway_ethanol: 10.1 },
  { id: "palio-1", brand: "Fiat", model: "Palio", version: "1.0 Fire Flex", year: 2017, category: "Hatch", fuel_type: "Flex", consumption_city_gasoline: 12.3, consumption_highway_gasoline: 14.0, consumption_city_ethanol: 8.5, consumption_highway_ethanol: 9.8 },
  { id: "palio-2", brand: "Fiat", model: "Palio", version: "1.6 16V Essence Flex", year: 2017, category: "Hatch", fuel_type: "Flex", consumption_city_gasoline: 10.8, consumption_highway_gasoline: 13.2, consumption_city_ethanol: 7.5, consumption_highway_ethanol: 9.2 },
  { id: "siena-1", brand: "Fiat", model: "Grand Siena", version: "1.4 Attractive Flex", year: 2021, category: "Sedan", fuel_type: "Flex", consumption_city_gasoline: 11.8, consumption_highway_gasoline: 14.1, consumption_city_ethanol: 8.2, consumption_highway_ethanol: 9.9 },
  { id: "mobi-1", brand: "Fiat", model: "Mobi", version: "1.0 Like / Trekking Fire Flex", year: 2024, category: "Hatch", fuel_type: "Flex", consumption_city_gasoline: 13.5, consumption_highway_gasoline: 15.0, consumption_city_ethanol: 9.6, consumption_highway_ethanol: 10.4 },
  { id: "argo-1", brand: "Fiat", model: "Argo", version: "1.0 Drive Flex MT", year: 2024, category: "Hatch", fuel_type: "Flex", consumption_city_gasoline: 13.6, consumption_highway_gasoline: 15.1, consumption_city_ethanol: 9.3, consumption_highway_ethanol: 10.3 },
  { id: "argo-2", brand: "Fiat", model: "Argo", version: "1.3 Trekking CVT", year: 2024, category: "Hatch", fuel_type: "Flex", consumption_city_gasoline: 12.6, consumption_highway_gasoline: 13.9, consumption_city_ethanol: 8.9, consumption_highway_ethanol: 10.1 },
  { id: "cronos-1", brand: "Fiat", model: "Cronos", version: "1.0 Drive Flex MT", year: 2024, category: "Sedan", fuel_type: "Flex", consumption_city_gasoline: 13.8, consumption_highway_gasoline: 15.6, consumption_city_ethanol: 9.6, consumption_highway_ethanol: 11.0 },
  { id: "cronos-2", brand: "Fiat", model: "Cronos", version: "1.3 Precision CVT", year: 2024, category: "Sedan", fuel_type: "Flex", consumption_city_gasoline: 12.4, consumption_highway_gasoline: 14.8, consumption_city_ethanol: 8.6, consumption_highway_ethanol: 10.3 },
  { id: "strada-1", brand: "Fiat", model: "Strada", version: "1.3 Firefly Endurance / Freedom", year: 2024, category: "Picape", fuel_type: "Flex", consumption_city_gasoline: 12.4, consumption_highway_gasoline: 13.9, consumption_city_ethanol: 8.8, consumption_highway_ethanol: 9.9 },
  { id: "strada-2", brand: "Fiat", model: "Strada", version: "1.0 Turbo Ultra / Ranch CVT", year: 2024, category: "Picape", fuel_type: "Flex", consumption_city_gasoline: 12.1, consumption_highway_gasoline: 13.2, consumption_city_ethanol: 8.3, consumption_highway_ethanol: 9.4 },
  { id: "pulse-1", brand: "Fiat", model: "Pulse", version: "1.0 Turbo Impetus CVT", year: 2024, category: "SUV", fuel_type: "Flex", consumption_city_gasoline: 12.0, consumption_highway_gasoline: 14.4, consumption_city_ethanol: 8.4, consumption_highway_ethanol: 10.2 },
  { id: "fastback-1", brand: "Fiat", model: "Fastback", version: "1.0 Turbo Impetus CVT", year: 2024, category: "SUV", fuel_type: "Flex", consumption_city_gasoline: 11.9, consumption_highway_gasoline: 13.9, consumption_city_ethanol: 8.4, consumption_highway_ethanol: 9.8 },
  { id: "toro-1", brand: "Fiat", model: "Toro", version: "1.3 Turbo Volcano Flex AT", year: 2024, category: "Picape", fuel_type: "Flex", consumption_city_gasoline: 9.7, consumption_highway_gasoline: 11.6, consumption_city_ethanol: 6.8, consumption_highway_ethanol: 8.2 },
  { id: "toro-2", brand: "Fiat", model: "Toro", version: "2.0 Turbo Diesel 4x4 AT9", year: 2024, category: "Picape", fuel_type: "Diesel", consumption_city_diesel: 10.1, consumption_highway_diesel: 12.4 },

  // VOLKSWAGEN (GOL, POLO, FOX, VOYAGE, VIRTUS, NIVUS, T-CROSS, TAOS, SAVEIRO, AMAROK, JETTA, GOLF, UP)
  { id: "gol-1", brand: "Volkswagen", model: "Gol", version: "1.0 MPI Flex", year: 2023, category: "Hatch", fuel_type: "Flex", consumption_city_gasoline: 13.7, consumption_highway_gasoline: 15.2, consumption_city_ethanol: 9.4, consumption_highway_ethanol: 10.8 },
  { id: "gol-2", brand: "Volkswagen", model: "Gol", version: "1.6 MSI Flex", year: 2022, category: "Hatch", fuel_type: "Flex", consumption_city_gasoline: 11.6, consumption_highway_gasoline: 13.6, consumption_city_ethanol: 8.0, consumption_highway_ethanol: 9.5 },
  { id: "gol-3", brand: "Volkswagen", model: "Gol", version: "1.0 G4 / G5 / G6 Total Flex", year: 2015, category: "Hatch", fuel_type: "Flex", consumption_city_gasoline: 12.9, consumption_highway_gasoline: 14.5, consumption_city_ethanol: 8.8, consumption_highway_ethanol: 10.1 },
  { id: "voyage-1", brand: "Volkswagen", model: "Voyage", version: "1.0 MPI Flex", year: 2023, category: "Sedan", fuel_type: "Flex", consumption_city_gasoline: 13.4, consumption_highway_gasoline: 15.6, consumption_city_ethanol: 9.3, consumption_highway_ethanol: 10.9 },
  { id: "voyage-2", brand: "Volkswagen", model: "Voyage", version: "1.6 MSI Flex", year: 2022, category: "Sedan", fuel_type: "Flex", consumption_city_gasoline: 11.8, consumption_highway_gasoline: 13.8, consumption_city_ethanol: 8.1, consumption_highway_ethanol: 9.7 },
  { id: "fox-1", brand: "Volkswagen", model: "Fox", version: "1.6 Connect / Xtreme Flex", year: 2022, category: "Hatch", fuel_type: "Flex", consumption_city_gasoline: 11.3, consumption_highway_gasoline: 13.3, consumption_city_ethanol: 7.8, consumption_highway_ethanol: 9.3 },
  { id: "up-1", brand: "Volkswagen", model: "Up!", version: "1.0 TSI Connect / Xtreme", year: 2021, category: "Hatch", fuel_type: "Flex", consumption_city_gasoline: 14.3, consumption_highway_gasoline: 16.3, consumption_city_ethanol: 10.0, consumption_highway_ethanol: 11.5 },
  { id: "polo-1", brand: "Volkswagen", model: "Polo", version: "1.0 MPI Track Flex MT", year: 2024, category: "Hatch", fuel_type: "Flex", consumption_city_gasoline: 13.7, consumption_highway_gasoline: 15.2, consumption_city_ethanol: 9.4, consumption_highway_ethanol: 10.8 },
  { id: "polo-2", brand: "Volkswagen", model: "Polo", version: "1.0 TSI Comfortline / Highline AT", year: 2024, category: "Hatch", fuel_type: "Flex", consumption_city_gasoline: 12.2, consumption_highway_gasoline: 15.1, consumption_city_ethanol: 8.4, consumption_highway_ethanol: 10.5 },
  { id: "virtus-1", brand: "Volkswagen", model: "Virtus", version: "1.0 TSI Comfortline / Highline AT", year: 2024, category: "Sedan", fuel_type: "Flex", consumption_city_gasoline: 12.1, consumption_highway_gasoline: 15.6, consumption_city_ethanol: 8.3, consumption_highway_ethanol: 10.2 },
  { id: "nivus-1", brand: "Volkswagen", model: "Nivus", version: "1.0 TSI Highline AT", year: 2024, category: "SUV", fuel_type: "Flex", consumption_city_gasoline: 11.9, consumption_highway_gasoline: 14.1, consumption_city_ethanol: 8.3, consumption_highway_ethanol: 9.9 },
  { id: "tcross-1", brand: "Volkswagen", model: "T-Cross", version: "1.0 TSI Comfortline AT", year: 2024, category: "SUV", fuel_type: "Flex", consumption_city_gasoline: 11.7, consumption_highway_gasoline: 14.0, consumption_city_ethanol: 8.2, consumption_highway_ethanol: 9.8 },
  { id: "tcross-2", brand: "Volkswagen", model: "T-Cross", version: "1.4 TSI Highline 250 TSI AT", year: 2024, category: "SUV", fuel_type: "Flex", consumption_city_gasoline: 11.8, consumption_highway_gasoline: 14.2, consumption_city_ethanol: 8.2, consumption_highway_ethanol: 10.0 },
  { id: "saveiro-1", brand: "Volkswagen", model: "Saveiro", version: "1.6 MSI Robust / Extreme Flex", year: 2024, category: "Picape", fuel_type: "Flex", consumption_city_gasoline: 11.5, consumption_highway_gasoline: 12.9, consumption_city_ethanol: 7.9, consumption_highway_ethanol: 9.1 },
  { id: "amarok-1", brand: "Volkswagen", model: "Amarok", version: "3.0 V6 Turbo Diesel Extreme 4x4", year: 2024, category: "Picape", fuel_type: "Diesel", consumption_city_diesel: 8.4, consumption_highway_diesel: 9.7 },

  // HYUNDAI (HB20, HB20S, CRETA, TUCSON, I30, IX35)
  { id: "hb20-1", brand: "Hyundai", model: "HB20", version: "1.0 12V Sense / Comfort MT", year: 2024, category: "Hatch", fuel_type: "Flex", consumption_city_gasoline: 13.1, consumption_highway_gasoline: 14.8, consumption_city_ethanol: 9.4, consumption_highway_ethanol: 10.4 },
  { id: "hb20-2", brand: "Hyundai", model: "HB20", version: "1.0 TGDI Turbo Platinum AT", year: 2024, category: "Hatch", fuel_type: "Flex", consumption_city_gasoline: 12.1, consumption_highway_gasoline: 14.4, consumption_city_ethanol: 8.3, consumption_highway_ethanol: 10.1 },
  { id: "hb20s-1", brand: "Hyundai", model: "HB20S", version: "1.0 TGDI Turbo Platinum Plus AT", year: 2024, category: "Sedan", fuel_type: "Flex", consumption_city_gasoline: 12.3, consumption_highway_gasoline: 14.9, consumption_city_ethanol: 8.6, consumption_highway_ethanol: 10.5 },
  { id: "creta-1", brand: "Hyundai", model: "Creta", version: "1.0 TGDI Turbo Comfort / Platinum AT", year: 2024, category: "SUV", fuel_type: "Flex", consumption_city_gasoline: 11.5, consumption_highway_gasoline: 12.0, consumption_city_ethanol: 8.2, consumption_highway_ethanol: 8.9 },
  { id: "creta-2", brand: "Hyundai", model: "Creta", version: "2.0 Ultimate Flex AT", year: 2024, category: "SUV", fuel_type: "Flex", consumption_city_gasoline: 10.9, consumption_highway_gasoline: 12.5, consumption_city_ethanol: 7.7, consumption_highway_ethanol: 8.9 },

  // TOYOTA (COROLLA, COROLLA CROSS, YARIS, ETIOS, HILUX, SW4, RAV4)
  { id: "corolla-1", brand: "Toyota", model: "Corolla", version: "2.0 Dynamic Force XEi / Altis CVT", year: 2024, category: "Sedan", fuel_type: "Flex", consumption_city_gasoline: 11.9, consumption_highway_gasoline: 14.2, consumption_city_ethanol: 8.3, consumption_highway_ethanol: 9.8 },
  { id: "corolla-2", brand: "Toyota", model: "Corolla Hybrid", version: "1.8 Hybrid Altis Premium Flex", year: 2024, category: "Sedan", fuel_type: "Híbrido", consumption_city_gasoline: 17.9, consumption_highway_gasoline: 15.4, consumption_city_ethanol: 12.8, consumption_highway_ethanol: 11.1 },
  { id: "corolla-cross-1", brand: "Toyota", model: "Corolla Cross", version: "2.0 Flex XRE / XRV CVT", year: 2024, category: "SUV", fuel_type: "Flex", consumption_city_gasoline: 11.7, consumption_highway_gasoline: 13.0, consumption_city_ethanol: 8.2, consumption_highway_ethanol: 9.0 },
  { id: "yaris-1", brand: "Toyota", model: "Yaris", version: "1.5 Flex XLS CVT", year: 2024, category: "Hatch", fuel_type: "Flex", consumption_city_gasoline: 12.2, consumption_highway_gasoline: 13.9, consumption_city_ethanol: 8.7, consumption_highway_ethanol: 9.8 },
  { id: "etios-1", brand: "Toyota", model: "Etios", version: "1.3 / 1.5 X / XS Flex", year: 2021, category: "Hatch", fuel_type: "Flex", consumption_city_gasoline: 12.8, consumption_highway_gasoline: 14.2, consumption_city_ethanol: 8.9, consumption_highway_ethanol: 10.0 },
  { id: "hilux-1", brand: "Toyota", model: "Hilux", version: "2.8 Turbo Diesel 4x4 SRX / GR-Sport", year: 2024, category: "Picape", fuel_type: "Diesel", consumption_city_diesel: 10.1, consumption_highway_diesel: 11.3 },

  // HONDA (CIVIC, CITY, HR-V, FIT, WR-V, CR-V)
  { id: "civic-1", brand: "Honda", model: "Civic", version: "2.0 e:HEV Híbrido Touring", year: 2024, category: "Sedan", fuel_type: "Híbrido", consumption_city_gasoline: 18.3, consumption_highway_gasoline: 15.9, consumption_city_ethanol: null, consumption_highway_ethanol: null },
  { id: "civic-2", brand: "Honda", model: "Civic", version: "2.0 EXL / Sport Flex CVT (G10)", year: 2021, category: "Sedan", fuel_type: "Flex", consumption_city_gasoline: 10.6, consumption_highway_gasoline: 13.4, consumption_city_ethanol: 7.2, consumption_highway_ethanol: 9.3 },
  { id: "civic-3", brand: "Honda", model: "Civic", version: "1.5 Turbo Touring CVT", year: 2021, category: "Sedan", fuel_type: "Gasolina", consumption_city_gasoline: 11.8, consumption_highway_gasoline: 14.4, consumption_city_ethanol: null, consumption_highway_ethanol: null },
  { id: "civic-4", brand: "Honda", model: "Civic", version: "1.8 / 2.0 LXL / EXR Flex (G9)", year: 2016, category: "Sedan", fuel_type: "Flex", consumption_city_gasoline: 10.2, consumption_highway_gasoline: 13.0, consumption_city_ethanol: 7.0, consumption_highway_ethanol: 9.0 },
  { id: "city-1", brand: "Honda", model: "City", version: "1.5 Flex EXL / Touring CVT", year: 2024, category: "Sedan", fuel_type: "Flex", consumption_city_gasoline: 13.1, consumption_highway_gasoline: 15.2, consumption_city_ethanol: 9.2, consumption_highway_ethanol: 10.5 },
  { id: "hrv-1", brand: "Honda", model: "HR-V", version: "1.5 Flex EX / EXL CVT", year: 2024, category: "SUV", fuel_type: "Flex", consumption_city_gasoline: 12.7, consumption_highway_gasoline: 13.9, consumption_city_ethanol: 8.8, consumption_highway_ethanol: 9.8 },
  { id: "hrv-2", brand: "Honda", model: "HR-V", version: "1.5 Turbo Advance / Touring CVT", year: 2024, category: "SUV", fuel_type: "Flex", consumption_city_gasoline: 11.3, consumption_highway_gasoline: 12.6, consumption_city_ethanol: 7.9, consumption_highway_ethanol: 8.8 },
  { id: "fit-1", brand: "Honda", model: "Fit", version: "1.5 DX / LX / EX / EXL Flex CVT", year: 2021, category: "Hatch", fuel_type: "Flex", consumption_city_gasoline: 12.3, consumption_highway_gasoline: 14.1, consumption_city_ethanol: 8.3, consumption_highway_ethanol: 9.9 },

  // JEEP & RENAULT & NISSAN & FORD & BYD & GWM & CAOA CHERY & PEUGEOT & CITROEN
  { id: "renegade-1", brand: "Jeep", model: "Renegade", version: "1.3 Turbo Flex Sport / Longitude AT", year: 2024, category: "SUV", fuel_type: "Flex", consumption_city_gasoline: 11.0, consumption_highway_gasoline: 12.8, consumption_city_ethanol: 7.7, consumption_highway_ethanol: 9.1 },
  { id: "compass-1", brand: "Jeep", model: "Compass", version: "1.3 Turbo Flex Longitude / Limited AT", year: 2024, category: "SUV", fuel_type: "Flex", consumption_city_gasoline: 10.3, consumption_highway_gasoline: 11.9, consumption_city_ethanol: 7.2, consumption_highway_ethanol: 8.3 },
  { id: "compass-2", brand: "Jeep", model: "Compass", version: "2.0 Turbo Diesel 4x4 Longitude / Limited AT", year: 2024, category: "SUV", fuel_type: "Diesel", consumption_city_diesel: 10.7, consumption_highway_diesel: 13.8 },
  { id: "kwid-1", brand: "Renault", model: "Kwid", version: "1.0 SCe Zen / Intense / Outsider", year: 2024, category: "Hatch", fuel_type: "Flex", consumption_city_gasoline: 15.3, consumption_highway_gasoline: 15.7, consumption_city_ethanol: 10.8, consumption_highway_ethanol: 11.0 },
  { id: "sandero-1", brand: "Renault", model: "Sandero", version: "1.0 / 1.6 SCe Zen / Stepway Flex", year: 2023, category: "Hatch", fuel_type: "Flex", consumption_city_gasoline: 13.9, consumption_highway_gasoline: 14.7, consumption_city_ethanol: 9.5, consumption_highway_ethanol: 10.2 },
  { id: "duster-1", brand: "Renault", model: "Duster", version: "1.6 SCe Iconic CVT", year: 2024, category: "SUV", fuel_type: "Flex", consumption_city_gasoline: 10.5, consumption_highway_gasoline: 11.5, consumption_city_ethanol: 7.2, consumption_highway_ethanol: 8.1 },
  { id: "kicks-1", brand: "Nissan", model: "Kicks", version: "1.6 Flex Advance / Exclusive CVT", year: 2024, category: "SUV", fuel_type: "Flex", consumption_city_gasoline: 11.4, consumption_highway_gasoline: 13.8, consumption_city_ethanol: 7.8, consumption_highway_ethanol: 9.5 },
  { id: "versa-1", brand: "Nissan", model: "Versa", version: "1.6 Flex Advance / Exclusive CVT", year: 2024, category: "Sedan", fuel_type: "Flex", consumption_city_gasoline: 11.7, consumption_highway_gasoline: 13.9, consumption_city_ethanol: 8.1, consumption_highway_ethanol: 9.6 },
  { id: "ka-1", brand: "Ford", model: "Ka", version: "1.0 Ti-VCT SE / SEL Flex", year: 2021, category: "Hatch", fuel_type: "Flex", consumption_city_gasoline: 13.4, consumption_highway_gasoline: 15.5, consumption_city_ethanol: 9.2, consumption_highway_ethanol: 10.7 },
  { id: "ecosport-1", brand: "Ford", model: "EcoSport", version: "1.5 Ti-VCT SE / Freestyle Flex AT", year: 2021, category: "SUV", fuel_type: "Flex", consumption_city_gasoline: 10.3, consumption_highway_gasoline: 12.0, consumption_city_ethanol: 7.1, consumption_highway_ethanol: 8.3 },
  { id: "ranger-1", brand: "Ford", model: "Ranger", version: "2.0 Turbo Diesel XLS 4x4 AT", year: 2024, category: "Picape", fuel_type: "Diesel", consumption_city_diesel: 10.0, consumption_highway_diesel: 11.5 },
  { id: "ranger-2", brand: "Ford", model: "Ranger", version: "3.0 V6 Turbo Diesel XLT / Limited 4x4", year: 2024, category: "Picape", fuel_type: "Diesel", consumption_city_diesel: 8.9, consumption_highway_diesel: 10.2 },
  { id: "byd-dolphin-1", brand: "BYD", model: "Dolphin", version: "Elétrico EV 44.9kWh", year: 2024, category: "Hatch", fuel_type: "Elétrico" },
  { id: "byd-dolphin-mini", brand: "BYD", model: "Dolphin Mini", version: "Elétrico EV 38.0kWh", year: 2024, category: "Hatch", fuel_type: "Elétrico" },
  { id: "byd-song-1", brand: "BYD", model: "Song Plus", version: "1.5 DM-i Híbrido Plug-in", year: 2024, category: "SUV", fuel_type: "Híbrido", consumption_city_gasoline: 21.0, consumption_highway_gasoline: 20.0 },
  { id: "gwm-haval-1", brand: "GWM", model: "Haval H6", version: "1.5 Turbo HEV Híbrido", year: 2024, category: "SUV", fuel_type: "Híbrido", consumption_city_gasoline: 13.8, consumption_highway_gasoline: 12.0 },
  { id: "tiggo7-1", brand: "Caoa Chery", model: "Tiggo 7 Pro", version: "1.6 Turbo Max Drive DCT", year: 2024, category: "SUV", fuel_type: "Gasolina", consumption_city_gasoline: 9.9, consumption_highway_gasoline: 11.7 },
  { id: "peugeot-208-1", brand: "Peugeot", model: "208", version: "1.0 Turbo Style CVT", year: 2024, category: "Hatch", fuel_type: "Flex", consumption_city_gasoline: 12.0, consumption_highway_gasoline: 14.4, consumption_city_ethanol: 8.4, consumption_highway_ethanol: 10.2 },
  { id: "c3-1", brand: "Citroën", model: "C3", version: "1.0 Live / Feel Firefly", year: 2024, category: "Hatch", fuel_type: "Flex", consumption_city_gasoline: 12.9, consumption_highway_gasoline: 14.1, consumption_city_ethanol: 9.3, consumption_highway_ethanol: 10.0 }
];

export async function searchAllVehicles(query: string): Promise<Vehicle[]> {
  const clean = query.trim().toLowerCase();
  if (!clean) return COMPREHENSIVE_VEHICLES.slice(0, 50);

  // 1. Buscar na base completa
  const directMatches = COMPREHENSIVE_VEHICLES.filter((v) => {
    const fullText = `${v.brand} ${v.model} ${v.version || ""} ${v.year || ""}`.toLowerCase();
    return fullText.includes(clean);
  });

  if (directMatches.length > 0) {
    return directMatches;
  }

  // 2. Se for um modelo não listado no subset pré-indexado, tentar FIPE
  return [];
}
