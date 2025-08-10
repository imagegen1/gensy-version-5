-- Gensy AI Creative Suite Database Schema
-- This file contains the complete database schema for the Gensy platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types/enums
CREATE TYPE generation_type AS ENUM ('image', 'video', 'upscale');
CREATE TYPE generation_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired', 'pending');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Users table (extends Clerk authentication)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_user_id TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    credits INTEGER DEFAULT 10 CHECK (credits >= 0),
    subscription_status subscription_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for users table
CREATE INDEX idx_users_clerk_user_id ON users(clerk_user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription_status ON users(subscription_status);

-- Subscription plans table
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2),
    price_yearly DECIMAL(10,2),
    credits_per_month INTEGER,
    features JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert updated subscription plans (INR pricing, yearly only)
INSERT INTO subscription_plans (name, description, price_monthly, price_yearly, credits_per_month, features) VALUES
('Free', 'Perfect for trying out Gensy', 0.00, 0.00, 100, '{"image_generation": true, "basic_upscaling": true, "video_generation": false, "batch_processing": false, "priority_support": false}'),
('Starter', 'Great for beginners', 30.00, 360.00, 1500, '{"image_generation": true, "advanced_upscaling": true, "video_generation": true, "batch_processing": true, "priority_support": false}'),
('Pro', 'Perfect for regular creators', 78.08, 937.00, 3904, '{"image_generation": true, "advanced_upscaling": true, "video_generation": true, "batch_processing": true, "priority_support": true, "api_access": false}'),
('Business', 'For professionals and teams', 348.75, 4185.00, 17437, '{"image_generation": true, "advanced_upscaling": true, "video_generation": true, "batch_processing": true, "priority_support": true, "api_access": true, "custom_models": false}'),
('Enterprise', 'For large teams and businesses', 737.50, 8850.00, 36875, '{"image_generation": true, "advanced_upscaling": true, "video_generation": true, "batch_processing": true, "priority_support": true, "api_access": true, "custom_models": true, "white_label": true}');

-- User subscriptions table
CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES subscription_plans(id),
    status subscription_status DEFAULT 'pending',
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    auto_renew BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for subscriptions
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_period_end ON user_subscriptions(current_period_end);

-- Service pricing table (tracks credit costs for different AI models)
CREATE TABLE service_pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider TEXT NOT NULL, -- e.g., 'Google Vertex AI', 'Black Forest AI', 'ByteDance'
    model_name TEXT NOT NULL, -- e.g., 'Imagen 4 Fast', 'FLUX.1 [dev]'
    service_type generation_type NOT NULL, -- 'image', 'video', 'upscale'
    api_cost_usd DECIMAL(10,4) NOT NULL, -- Original API cost in USD
    api_cost_inr DECIMAL(10,2) NOT NULL, -- API cost converted to INR
    storage_cost_inr DECIMAL(10,2) DEFAULT 0.01, -- Storage/egress cost in INR
    total_cost_inr DECIMAL(10,2) NOT NULL, -- Total cost to Gensy in INR
    selling_price_inr DECIMAL(10,2) NOT NULL, -- Selling price with margin in INR
    credits_required INTEGER NOT NULL, -- Credits charged to user
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for service pricing
CREATE INDEX idx_service_pricing_provider ON service_pricing(provider);
CREATE INDEX idx_service_pricing_model_name ON service_pricing(model_name);
CREATE INDEX idx_service_pricing_service_type ON service_pricing(service_type);
CREATE INDEX idx_service_pricing_is_active ON service_pricing(is_active);

-- Insert service pricing data (based on 55% gross margin pricing sheet)
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

-- Generations table (stores all AI generations)
CREATE TABLE generations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type generation_type NOT NULL,
    prompt TEXT NOT NULL,
    model_used TEXT NOT NULL,
    status generation_status DEFAULT 'pending',
    result_url TEXT,
    metadata JSONB,
    credits_used INTEGER DEFAULT 1,
    processing_time_seconds INTEGER,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for generations
CREATE INDEX idx_generations_user_id ON generations(user_id);
CREATE INDEX idx_generations_type ON generations(type);
CREATE INDEX idx_generations_status ON generations(status);
CREATE INDEX idx_generations_created_at ON generations(created_at DESC);
CREATE INDEX idx_generations_user_type ON generations(user_id, type);

-- Media files table (stores file metadata)
CREATE TABLE media_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    generation_id UUID REFERENCES generations(id) ON DELETE SET NULL,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    width INTEGER,
    height INTEGER,
    duration DECIMAL(10,2), -- for videos, in seconds
    checksum TEXT, -- for file integrity
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for media files
CREATE INDEX idx_media_files_user_id ON media_files(user_id);
CREATE INDEX idx_media_files_generation_id ON media_files(generation_id);
CREATE INDEX idx_media_files_mime_type ON media_files(mime_type);
CREATE INDEX idx_media_files_created_at ON media_files(created_at DESC);

-- Credit transactions table (tracks credit usage and purchases)
CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('purchase', 'usage', 'refund', 'bonus')),
    amount INTEGER NOT NULL, -- positive for additions, negative for usage
    description TEXT,
    generation_id UUID REFERENCES generations(id) ON DELETE SET NULL,
    payment_id TEXT, -- external payment reference
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for credit transactions
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at DESC);

-- Payments table (tracks all payment transactions)
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    transaction_id TEXT UNIQUE NOT NULL, -- external payment gateway ID
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    type TEXT NOT NULL CHECK (type IN ('subscription', 'credits', 'refund')),
    status payment_status DEFAULT 'pending',
    plan_id UUID REFERENCES subscription_plans(id),
    credits_purchased INTEGER,
    payment_method TEXT,
    gateway_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for payments
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);

-- Generation history table (audit trail for generations)
CREATE TABLE generation_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    generation_id UUID REFERENCES generations(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for generation history
CREATE INDEX idx_generation_history_user_id ON generation_history(user_id);
CREATE INDEX idx_generation_history_generation_id ON generation_history(generation_id);
CREATE INDEX idx_generation_history_created_at ON generation_history(created_at DESC);

-- User preferences table
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    preferences JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for user preferences
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- API keys table (for API access)
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    key_hash TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    last_used_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    rate_limit_per_hour INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for API keys
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_is_active ON api_keys(is_active);

-- Usage analytics table (for tracking usage patterns)
CREATE TABLE usage_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    generation_type generation_type,
    credits_used INTEGER,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for usage analytics
CREATE INDEX idx_usage_analytics_user_id ON usage_analytics(user_id);
CREATE INDEX idx_usage_analytics_event_type ON usage_analytics(event_type);
CREATE INDEX idx_usage_analytics_timestamp ON usage_analytics(timestamp DESC);
CREATE INDEX idx_usage_analytics_generation_type ON usage_analytics(generation_type);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_pricing_updated_at BEFORE UPDATE ON service_pricing
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
