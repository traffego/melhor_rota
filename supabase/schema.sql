-- Schema para o Banco de Dados Melhor Rota (Supabase)

-- 1. Tabela de Veículos (Base Inmetro PBEV)
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    version TEXT,
    year INT,
    category TEXT,
    fuel_type TEXT DEFAULT 'Flex',
    consumption_city_gasoline NUMERIC(4, 1),
    consumption_highway_gasoline NUMERIC(4, 1),
    consumption_city_ethanol NUMERIC(4, 1),
    consumption_highway_ethanol NUMERIC(4, 1),
    consumption_city_diesel NUMERIC(4, 1),
    consumption_highway_diesel NUMERIC(4, 1),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de Preços Médios de Combustíveis (Referência ANP)
CREATE TABLE IF NOT EXISTS public.fuel_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_uf VARCHAR(2) NOT NULL UNIQUE,
    state_name TEXT NOT NULL,
    gasoline_avg NUMERIC(5, 2) NOT NULL,
    ethanol_avg NUMERIC(5, 2) NOT NULL,
    diesel_avg NUMERIC(5, 2) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabela de Configurações de Pixels e Rastreamento
CREATE TABLE IF NOT EXISTS public.pixel_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform VARCHAR(50) NOT NULL UNIQUE, -- 'meta', 'gtm', 'tiktok', 'gads'
    name TEXT NOT NULL,
    pixel_id TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT false,
    conversion_token TEXT DEFAULT '',
    custom_events_config JSONB DEFAULT '{"on_vehicle_select": true, "on_route_calculate": true}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabela de Configurações Gerais da Aplicação
CREATE TABLE IF NOT EXISTS public.app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value TEXT DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Histórico e Logs de Rotas Calculadas
CREATE TABLE IF NOT EXISTS public.route_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origin_name TEXT NOT NULL,
    origin_lat NUMERIC(10, 6),
    origin_lng NUMERIC(10, 6),
    destination_name TEXT NOT NULL,
    destination_lat NUMERIC(10, 6),
    destination_lng NUMERIC(10, 6),
    vehicle_name TEXT,
    vehicle_brand TEXT,
    vehicle_model TEXT,
    distance_km NUMERIC(8, 2),
    duration_minutes NUMERIC(8, 2),
    fuel_type TEXT,
    fuel_price NUMERIC(5, 2),
    fuel_cost NUMERIC(8, 2),
    toll_cost NUMERIC(8, 2),
    total_cost NUMERIC(8, 2),
    is_round_trip BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pixel_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de Leitura Pública
CREATE POLICY "Leitura pública de veículos" ON public.vehicles FOR SELECT USING (true);
CREATE POLICY "Leitura pública de preços de combustível" ON public.fuel_prices FOR SELECT USING (true);
CREATE POLICY "Leitura pública de pixels ativos" ON public.pixel_settings FOR SELECT USING (true);
CREATE POLICY "Inserção pública de logs de rota" ON public.route_logs FOR INSERT WITH CHECK (true);

-- Políticas para escrita de Admin autenticado
CREATE POLICY "Admin gerenciar veículos" ON public.vehicles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin gerenciar preços" ON public.fuel_prices FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin gerenciar pixels" ON public.pixel_settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin gerenciar settings" ON public.app_settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin ver logs de rota" ON public.route_logs FOR ALL USING (auth.role() = 'authenticated');

-- SEED INICIAL DE PIXELS
INSERT INTO public.pixel_settings (platform, name, pixel_id, is_active)
VALUES 
    ('meta', 'Meta Pixel (Facebook/Instagram Ads)', '', false),
    ('gtm', 'Google Tag Manager (GTM)', '', false),
    ('tiktok', 'TikTok Pixel', '', false),
    ('gads', 'Google Ads Conversion Tag', '', false)
ON CONFLICT (platform) DO NOTHING;

-- SEED INICIAL DE PREÇOS MÉDIOS ANP (Média Nacional e Principais Estados)
INSERT INTO public.fuel_prices (state_uf, state_name, gasoline_avg, ethanol_avg, diesel_avg)
VALUES 
    ('BR', 'Média Brasil', 6.05, 4.09, 5.95),
    ('SP', 'São Paulo', 5.89, 3.89, 5.85),
    ('RJ', 'Rio de Janeiro', 6.12, 4.29, 6.05),
    ('MG', 'Minas Gerais', 6.08, 4.15, 5.92),
    ('PR', 'Paraná', 6.15, 4.25, 5.88),
    ('SC', 'Santa Catarina', 6.19, 4.39, 5.94),
    ('RS', 'Rio Grande do Sul', 6.22, 4.45, 5.99),
    ('BA', 'Bahia', 6.29, 4.49, 6.09),
    ('GO', 'Goiás', 5.98, 3.99, 5.89),
    ('DF', 'Distrito Federal', 6.02, 4.05, 5.90)
ON CONFLICT (state_uf) DO NOTHING;

-- SEED INICIAL DE VEÍCULOS POPULARES (INMETRO PBEV)
INSERT INTO public.vehicles (brand, model, version, year, category, fuel_type, consumption_city_gasoline, consumption_highway_gasoline, consumption_city_ethanol, consumption_highway_ethanol, consumption_city_diesel, consumption_highway_diesel)
VALUES
    ('Chevrolet', 'Onix', '1.0 Turbo MT', 2024, 'Hatch', 'Flex', 13.3, 16.5, 9.4, 11.6, NULL, NULL),
    ('Chevrolet', 'Onix Plus', '1.0 Turbo AT', 2024, 'Sedan', 'Flex', 12.3, 15.6, 8.6, 10.9, NULL, NULL),
    ('Chevrolet', 'Tracker', '1.0 Turbo AT', 2024, 'SUV', 'Flex', 11.2, 13.4, 7.8, 9.6, NULL, NULL),
    ('Chevrolet', 'S10', '2.8 Turbo Diesel 4x4', 2024, 'Picape', 'Diesel', NULL, NULL, NULL, NULL, 9.2, 10.6),
    ('Fiat', 'Strada', '1.3 Firefly Flex', 2024, 'Picape', 'Flex', 12.4, 13.9, 8.8, 9.9, NULL, NULL),
    ('Fiat', 'Mobi', '1.0 Fire Flex', 2024, 'Hatch', 'Flex', 13.5, 15.0, 9.6, 10.4, NULL, NULL),
    ('Fiat', 'Pulse', '1.0 Turbo AT', 2024, 'SUV', 'Flex', 12.0, 14.4, 8.4, 10.2, NULL, NULL),
    ('Fiat', 'Toro', '1.3 Turbo Flex', 2024, 'Picape', 'Flex', 9.7, 11.6, 6.8, 8.2, NULL, NULL),
    ('Fiat', 'Fastback', '1.0 Turbo AT', 2024, 'SUV', 'Flex', 11.9, 13.9, 8.4, 9.8, NULL, NULL),
    ('Hyundai', 'HB20', '1.0 12V Flex MT', 2024, 'Hatch', 'Flex', 13.1, 14.8, 9.4, 10.4, NULL, NULL),
    ('Hyundai', 'HB20', '1.0 Turbo AT', 2024, 'Hatch', 'Flex', 12.1, 14.4, 8.3, 10.1, NULL, NULL),
    ('Hyundai', 'Creta', '1.0 Turbo AT', 2024, 'SUV', 'Flex', 11.5, 12.0, 8.2, 8.9, NULL, NULL),
    ('Volkswagen', 'Polo', '1.0 TSI MT', 2024, 'Hatch', 'Flex', 14.0, 16.4, 9.6, 11.5, NULL, NULL),
    ('Volkswagen', 'Polo Track', '1.0 MPI MT', 2024, 'Hatch', 'Flex', 13.7, 15.2, 9.4, 10.8, NULL, NULL),
    ('Volkswagen', 'Nivus', '1.0 TSI AT', 2024, 'SUV', 'Flex', 11.9, 14.1, 8.3, 9.9, NULL, NULL),
    ('Volkswagen', 'T-Cross', '1.0 TSI AT', 2024, 'SUV', 'Flex', 11.7, 14.0, 8.2, 9.8, NULL, NULL),
    ('Volkswagen', 'Saveiro', '1.6 MSI Flex', 2024, 'Picape', 'Flex', 11.5, 12.9, 7.9, 9.1, NULL, NULL),
    ('Toyota', 'Corolla', '2.0 Dynamic Force AT', 2024, 'Sedan', 'Flex', 11.9, 14.2, 8.3, 9.8, NULL, NULL),
    ('Toyota', 'Corolla Hybrid', '1.8 Hybrid Flex', 2024, 'Sedan', 'Híbrido', 17.9, 15.4, 12.8, 11.1, NULL, NULL),
    ('Toyota', 'Corolla Cross', '2.0 Flex AT', 2024, 'SUV', 'Flex', 11.7, 13.0, 8.2, 9.0, NULL, NULL),
    ('Toyota', 'Hilux', '2.8 Turbo Diesel 4x4', 2024, 'Picape', 'Diesel', NULL, NULL, NULL, NULL, 10.1, 11.3),
    ('Toyota', 'Yaris', '1.5 Flex AT', 2024, 'Hatch', 'Flex', 12.2, 13.9, 8.7, 9.8, NULL, NULL),
    ('Jeep', 'Renegade', '1.3 Turbo Flex AT', 2024, 'SUV', 'Flex', 11.0, 12.8, 7.7, 9.1, NULL, NULL),
    ('Jeep', 'Compass', '1.3 Turbo Flex AT', 2024, 'SUV', 'Flex', 10.3, 11.9, 7.2, 8.3, NULL, NULL),
    ('Honda', 'HR-V', '1.5 Flex AT', 2024, 'SUV', 'Flex', 12.7, 13.9, 8.8, 9.8, NULL, NULL),
    ('Honda', 'City', '1.5 Flex AT', 2024, 'Sedan', 'Flex', 13.1, 15.2, 9.2, 10.5, NULL, NULL),
    ('Nissan', 'Kicks', '1.6 Flex CVT', 2024, 'SUV', 'Flex', 11.4, 13.8, 7.8, 9.5, NULL, NULL),
    ('Nissan', 'Versa', '1.6 Flex CVT', 2024, 'Sedan', 'Flex', 11.7, 13.9, 8.1, 9.6, NULL, NULL),
    ('Renault', 'Kwid', '1.0 SCe MT', 2024, 'Hatch', 'Flex', 15.3, 15.7, 10.8, 11.0, NULL, NULL),
    ('Renault', 'Duster', '1.6 Flex CVT', 2024, 'SUV', 'Flex', 10.5, 11.5, 7.2, 8.1, NULL, NULL),
    ('Ford', 'Ranger', '2.0 Turbo Diesel AT', 2024, 'Picape', 'Diesel', NULL, NULL, NULL, NULL, 10.0, 11.5),
    ('BYD', 'Dolphin', 'Elétrico EV 44.9kWh', 2024, 'Hatch', 'Elétrico', NULL, NULL, NULL, NULL, NULL, NULL),
    ('BYD', 'Song Plus', '1.5 DM-i Híbrido Plug-in', 2024, 'SUV', 'Híbrido', 21.0, 20.0, NULL, NULL, NULL, NULL)
ON CONFLICT DO NOTHING;
