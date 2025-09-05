-- Create queue system tables for advanced AI generation queue management
-- Migration: 20250109000003_create_queue_tables.sql

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Main generation queue table
CREATE TABLE IF NOT EXISTS generation_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    request_data JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('high', 'normal', 'low')),
    model_requested TEXT NOT NULL,
    model_used TEXT,
    generation_type TEXT NOT NULL CHECK (generation_type IN ('image', 'video', 'upscaling', 'text', 'audio')),
    queue_position INTEGER,
    estimated_wait_seconds INTEGER,
    result_data JSONB,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Model capacity tracking table
CREATE TABLE IF NOT EXISTS model_capacity (
    model_id TEXT PRIMARY KEY,
    generation_type TEXT NOT NULL CHECK (generation_type IN ('image', 'video', 'upscaling', 'text', 'audio')),
    provider TEXT NOT NULL,
    max_concurrent INTEGER NOT NULL DEFAULT 1,
    current_usage INTEGER DEFAULT 0,
    avg_processing_time_seconds INTEGER DEFAULT 30,
    success_rate DECIMAL(5,4) DEFAULT 0.95,
    error_rate DECIMAL(5,4) DEFAULT 0.05,
    total_requests INTEGER DEFAULT 0,
    successful_requests INTEGER DEFAULT 0,
    failed_requests INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Queue analytics table for monitoring and insights
CREATE TABLE IF NOT EXISTS queue_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    generation_type TEXT NOT NULL,
    model_id TEXT NOT NULL,
    total_requests INTEGER DEFAULT 0,
    completed_requests INTEGER DEFAULT 0,
    failed_requests INTEGER DEFAULT 0,
    cancelled_requests INTEGER DEFAULT 0,
    avg_wait_time_seconds INTEGER DEFAULT 0,
    avg_processing_time_seconds INTEGER DEFAULT 0,
    peak_queue_size INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(date, generation_type, model_id)
);

-- Queue position tracking for real-time updates
CREATE TABLE IF NOT EXISTS queue_positions (
    queue_id UUID PRIMARY KEY REFERENCES generation_queue(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    current_position INTEGER NOT NULL,
    estimated_wait_seconds INTEGER,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Model alternatives mapping for smart fallbacks
CREATE TABLE IF NOT EXISTS model_alternatives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    primary_model TEXT NOT NULL,
    alternative_model TEXT NOT NULL,
    generation_type TEXT NOT NULL,
    priority_order INTEGER NOT NULL DEFAULT 1,
    quality_score DECIMAL(3,2) DEFAULT 0.90,
    speed_score DECIMAL(3,2) DEFAULT 0.90,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(primary_model, alternative_model)
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_generation_queue_status ON generation_queue(status);
CREATE INDEX IF NOT EXISTS idx_generation_queue_priority ON generation_queue(priority);
CREATE INDEX IF NOT EXISTS idx_generation_queue_user_id ON generation_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_queue_model_requested ON generation_queue(model_requested);
CREATE INDEX IF NOT EXISTS idx_generation_queue_generation_type ON generation_queue(generation_type);
CREATE INDEX IF NOT EXISTS idx_generation_queue_created_at ON generation_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_model_capacity_generation_type ON model_capacity(generation_type);
CREATE INDEX IF NOT EXISTS idx_queue_analytics_date ON queue_analytics(date);
CREATE INDEX IF NOT EXISTS idx_queue_positions_user_id ON queue_positions(user_id);

-- Triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_generation_queue_updated_at 
    BEFORE UPDATE ON generation_queue 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_model_capacity_updated_at 
    BEFORE UPDATE ON model_capacity 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial model capacity data
INSERT INTO model_capacity (model_id, generation_type, provider, max_concurrent, avg_processing_time_seconds) VALUES
-- Image Generation Models
('imagen-4.0-generate-preview-06-06', 'image', 'google-vertex-ai', 7, 45),
('imagen-4.0-fast-generate-preview-06-06', 'image', 'google-vertex-ai', 10, 30),
('imagen-4.0-ultra-generate-preview', 'image', 'google-vertex-ai', 5, 60),
('imagen-3.0-generate-001', 'image', 'google-vertex-ai', 12, 35),
('imagen-3.0-fast-generate-001', 'image', 'google-vertex-ai', 15, 25),
('flux-pro', 'image', 'black-forest-labs', 5, 25),
('flux-pro-1.1', 'image', 'black-forest-labs', 4, 30),
('flux-pro-1.1-ultra', 'image', 'black-forest-labs', 3, 45),
('flux-dev', 'image', 'black-forest-labs', 8, 20),
('flux-kontext-max', 'image', 'black-forest-labs', 6, 35),
('flux-kontext-pro', 'image', 'black-forest-labs', 7, 28),
('bytedance-seedream-3.0-t2i', 'image', 'bytedance', 15, 35),

-- Video Generation Models
('veo-2.0-generate-001', 'video', 'google-vertex-ai', 3, 120),
('veo-3.0-generate-preview', 'video', 'google-vertex-ai', 2, 150),
('veo-3.0-fast-generate-preview', 'video', 'google-vertex-ai', 4, 90),
('seedance-1-0-lite-t2v-250428', 'video', 'bytedance', 5, 100),
('seedance-1-0-lite-i2v-250428', 'video', 'bytedance', 4, 110),
('seedance-1-0-pro-250528', 'video', 'bytedance', 3, 130),
('MiniMax-Hailuo-02', 'video', 'minimax', 5, 100),
('MiniMax-T2V-01', 'video', 'minimax', 6, 80),
('MiniMax-I2V-01', 'video', 'minimax', 4, 90),
('MiniMax-I2V-01-live', 'video', 'minimax', 8, 60),
('MiniMax-S2V-01', 'video', 'minimax', 3, 110),
('replicate-wan-2.1', 'video', 'replicate', 4, 95),

-- Upscaling Models
('vertex-ai-standard', 'upscaling', 'google-vertex-ai', 15, 20),
('vertex-ai-enhanced', 'upscaling', 'google-vertex-ai', 10, 35),

-- Text Generation Models
('gemini-1.5-flash', 'text', 'google-vertex-ai', 50, 5)

ON CONFLICT (model_id) DO UPDATE SET
    max_concurrent = EXCLUDED.max_concurrent,
    avg_processing_time_seconds = EXCLUDED.avg_processing_time_seconds,
    last_updated = NOW();

-- Insert model alternatives for smart fallbacks
INSERT INTO model_alternatives (primary_model, alternative_model, generation_type, priority_order, quality_score, speed_score) VALUES
-- Image model fallbacks
('imagen-4.0-ultra-generate-preview', 'imagen-4.0-generate-preview-06-06', 'image', 1, 0.95, 0.80),
('imagen-4.0-ultra-generate-preview', 'imagen-4.0-fast-generate-preview-06-06', 'image', 2, 0.90, 0.95),
('imagen-4.0-generate-preview-06-06', 'imagen-4.0-fast-generate-preview-06-06', 'image', 1, 0.95, 0.95),
('imagen-4.0-generate-preview-06-06', 'imagen-3.0-generate-001', 'image', 2, 0.85, 0.90),
('flux-pro-1.1-ultra', 'flux-pro-1.1', 'image', 1, 0.95, 0.85),
('flux-pro-1.1-ultra', 'flux-kontext-pro', 'image', 2, 0.90, 0.90),
('flux-pro-1.1', 'flux-pro', 'image', 1, 0.95, 0.90),
('flux-pro', 'flux-dev', 'image', 1, 0.85, 0.95),
('flux-kontext-max', 'flux-kontext-pro', 'image', 1, 0.95, 0.90),

-- Video model fallbacks
('veo-3.0-generate-preview', 'veo-3.0-fast-generate-preview', 'video', 1, 0.90, 0.95),
('veo-3.0-generate-preview', 'veo-2.0-generate-001', 'video', 2, 0.85, 0.90),
('seedance-1-0-pro-250528', 'seedance-1-0-lite-t2v-250428', 'video', 1, 0.85, 0.90),
('MiniMax-Hailuo-02', 'MiniMax-T2V-01', 'video', 1, 0.90, 0.95),
('MiniMax-I2V-01', 'MiniMax-I2V-01-live', 'video', 1, 0.85, 0.95),

-- Upscaling fallbacks
('vertex-ai-enhanced', 'vertex-ai-standard', 'upscaling', 1, 0.80, 0.95)

ON CONFLICT (primary_model, alternative_model) DO NOTHING;

-- Create RLS policies
ALTER TABLE generation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_positions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own queue items
CREATE POLICY "Users can view own queue items" ON generation_queue
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own queue items" ON generation_queue
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own queue items" ON generation_queue
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can only see their own queue positions
CREATE POLICY "Users can view own queue positions" ON queue_positions
    FOR SELECT USING (auth.uid() = user_id);

-- Service role can access all data
CREATE POLICY "Service role full access generation_queue" ON generation_queue
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access queue_positions" ON queue_positions
    FOR ALL USING (auth.role() = 'service_role');

-- Grant necessary permissions
GRANT ALL ON generation_queue TO service_role;
GRANT ALL ON model_capacity TO service_role;
GRANT ALL ON queue_analytics TO service_role;
GRANT ALL ON queue_positions TO service_role;
GRANT ALL ON model_alternatives TO service_role;

-- Create function to get queue position
CREATE OR REPLACE FUNCTION get_queue_position(queue_item_id UUID)
RETURNS INTEGER AS $$
DECLARE
    position INTEGER;
BEGIN
    SELECT COUNT(*) + 1 INTO position
    FROM generation_queue
    WHERE status = 'queued'
    AND created_at < (SELECT created_at FROM generation_queue WHERE id = queue_item_id)
    AND priority >= (SELECT priority FROM generation_queue WHERE id = queue_item_id);
    
    RETURN position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to estimate wait time
CREATE OR REPLACE FUNCTION estimate_wait_time(queue_item_id UUID)
RETURNS INTEGER AS $$
DECLARE
    position INTEGER;
    model_id TEXT;
    avg_time INTEGER;
    capacity INTEGER;
    wait_time INTEGER;
BEGIN
    SELECT model_requested INTO model_id FROM generation_queue WHERE id = queue_item_id;
    SELECT get_queue_position(queue_item_id) INTO position;
    
    SELECT avg_processing_time_seconds, max_concurrent 
    INTO avg_time, capacity
    FROM model_capacity 
    WHERE model_capacity.model_id = model_id;
    
    -- Calculate estimated wait time based on position and capacity
    wait_time := GREATEST(30, (position * avg_time) / GREATEST(capacity, 1));
    
    RETURN wait_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
