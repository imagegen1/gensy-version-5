-- Migration: Fix Credits Schema
-- This migration ensures the profiles table has proper credit defaults and constraints

-- First, update any existing null credits to 10
UPDATE profiles 
SET credits = 10, updated_at = NOW() 
WHERE credits IS NULL;

-- Add NOT NULL constraint and default value to credits column
-- Note: This assumes the profiles table exists. If using 'users' table instead, adjust accordingly.
ALTER TABLE profiles 
ALTER COLUMN credits SET DEFAULT 10,
ALTER COLUMN credits SET NOT NULL;

-- Add check constraint to ensure credits are never negative
ALTER TABLE profiles 
ADD CONSTRAINT check_credits_non_negative 
CHECK (credits >= 0);

-- Create index on credits for performance
CREATE INDEX IF NOT EXISTS idx_profiles_credits ON profiles(credits);

-- Insert a record into migrations table if it exists
INSERT INTO migrations (id, name, applied_at) 
VALUES ('004_fix_credits_schema', 'Fix Credits Schema', NOW())
ON CONFLICT (id) DO NOTHING;
