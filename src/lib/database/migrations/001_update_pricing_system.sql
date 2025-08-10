-- Migration: Update Pricing System to INR with New Plans and Service Pricing
-- Date: 2025-01-09
-- Description: Updates subscription plans to INR pricing and adds service pricing table

BEGIN;

-- 1. Update existing subscription plans with new INR pricing
UPDATE subscription_plans SET 
    price_monthly = 0.00,
    price_yearly = 0.00,
    credits_per_month = 100,
    description = 'Perfect for trying out Gensy',
    features = '{"image_generation": true, "basic_upscaling": true, "video_generation": false, "batch_processing": false, "priority_support": false}'
WHERE name = 'Free';

-- Delete old plans that don't match new structure
DELETE FROM subscription_plans WHERE name NOT IN ('Free');

-- Insert new subscription plans
INSERT INTO subscription_plans (name, description, price_monthly, price_yearly, credits_per_month, features) VALUES
('Starter', 'Great for beginners', 30.00, 360.00, 1500, '{"image_generation": true, "advanced_upscaling": true, "video_generation": true, "batch_processing": true, "priority_support": false}'),
('Pro', 'Perfect for regular creators', 78.08, 937.00, 3904, '{"image_generation": true, "advanced_upscaling": true, "video_generation": true, "batch_processing": true, "priority_support": true, "api_access": false}'),
('Business', 'For professionals and teams', 348.75, 4185.00, 17437, '{"image_generation": true, "advanced_upscaling": true, "video_generation": true, "batch_processing": true, "priority_support": true, "api_access": true, "custom_models": false}'),
('Enterprise', 'For large teams and businesses', 737.50, 8850.00, 36875, '{"image_generation": true, "advanced_upscaling": true, "video_generation": true, "batch_processing": true, "priority_support": true, "api_access": true, "custom_models": true, "white_label": true}');

-- 2. Create service pricing table
CREATE TABLE IF NOT EXISTS service_pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider TEXT NOT NULL,
    model_name TEXT NOT NULL,
    service_type generation_type NOT NULL,
    api_cost_usd DECIMAL(10,4) NOT NULL,
    api_cost_inr DECIMAL(10,2) NOT NULL,
    storage_cost_inr DECIMAL(10,2) DEFAULT 0.01,
    total_cost_inr DECIMAL(10,2) NOT NULL,
    selling_price_inr DECIMAL(10,2) NOT NULL,
    credits_required INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for service pricing
CREATE INDEX IF NOT EXISTS idx_service_pricing_provider ON service_pricing(provider);
CREATE INDEX IF NOT EXISTS idx_service_pricing_model_name ON service_pricing(model_name);
CREATE INDEX IF NOT EXISTS idx_service_pricing_service_type ON service_pricing(service_type);
CREATE INDEX IF NOT EXISTS idx_service_pricing_is_active ON service_pricing(is_active);

-- 3. Insert service pricing data
INSERT INTO service_pricing (provider, model_name, service_type, api_cost_usd, api_cost_inr, storage_cost_inr, total_cost_inr, selling_price_inr, credits_required) VALUES
-- Image Generation Models
('Google Vertex AI', 'Imagen 4 Fast', 'image', 0.020, 1.76, 0.01, 1.77, 3.94, 197),
('Google Vertex AI', 'Imagen 3 Fast', 'image', 0.020, 1.76, 0.01, 1.77, 3.94, 197),
('Black Forest AI', 'FLUX.1 [dev]', 'image', 0.025, 2.20, 0.01, 2.21, 4.92, 246),
('ByteDance', 'SeeDream 3.0 (t2i)', 'image', 0.030, 2.64, 0.01, 2.65, 5.90, 295),
('Google Vertex AI', 'Imagen 4', 'image', 0.040, 3.52, 0.01, 3.53, 7.86, 393),
('Google Vertex AI', 'Imagen 3', 'image', 0.040, 3.52, 0.01, 3.53, 7.86, 393),
('Black Forest AI', 'FLUX 1.1 [pro]', 'image', 0.040, 3.52, 0.01, 3.53, 7.86, 393),
('Black Forest AI', 'FLUX Kontext [pro]', 'image', 0.040, 3.52, 0.01, 3.53, 7.86, 393),
('Black Forest AI', 'FLUX.1 [pro]', 'image', 0.050, 4.40, 0.01, 4.41, 9.80, 490),
('Black Forest AI', 'FLUX Fill', 'image', 0.050, 4.40, 0.01, 4.41, 9.80, 490),
('Black Forest AI', 'FLUX Canny', 'image', 0.050, 4.40, 0.01, 4.41, 9.80, 490),
('Black Forest AI', 'FLUX Depth', 'image', 0.050, 4.40, 0.01, 4.41, 9.80, 490),
('Black Forest AI', 'FLUX 1.1 [pro] Ultra', 'image', 0.060, 5.28, 0.01, 5.29, 11.76, 588),
('Google Vertex AI', 'Imagen 4 Ultra', 'image', 0.060, 5.28, 0.01, 5.29, 11.76, 588),
('Black Forest AI', 'FLUX.1 Kontext [max]', 'image', 0.080, 7.04, 0.01, 7.05, 15.68, 784),
-- Video Generation Models (10 second 1080p)
('Minimax', 'T2V/I2V-Director', 'video', 0.430, 37.84, 0.05, 37.89, 84.20, 4210),
('Minimax', 'I2V-live', 'video', 0.430, 37.84, 0.05, 37.89, 84.20, 4210),
('Minimax', 'S2V-01', 'video', 0.650, 57.20, 0.05, 57.25, 127.24, 6362),
('Minimax', 'Hailuo-02 (1080p 10s)', 'video', 0.820, 72.16, 0.05, 72.21, 160.48, 8024),
('ByteDance', 'SeeDance Lite (1080p 10s)', 'video', 0.880, 77.44, 0.05, 77.49, 172.20, 8610),
('ByteDance', 'SeeDance Pro (1080p 10s)', 'video', 1.220, 107.36, 0.05, 107.41, 238.70, 11935),
('Google Vertex AI', 'Veo 3 Fast (1080p 10s)', 'video', 4.000, 352.00, 0.39, 352.39, 783.10, 39155),
('Google Vertex AI', 'Veo 3 (1080p 10s)', 'video', 7.500, 660.00, 0.39, 660.39, 1467.54, 73377);

-- 4. Create trigger for service_pricing updated_at
CREATE TRIGGER update_service_pricing_updated_at BEFORE UPDATE ON service_pricing
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Update currency in payments table to INR by default
ALTER TABLE payments ALTER COLUMN currency SET DEFAULT 'INR';

COMMIT;
