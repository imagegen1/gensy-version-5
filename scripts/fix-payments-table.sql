
-- Manual SQL Script to Fix Payments Table
-- Run this in the Supabase SQL Editor

-- First, let's see the current structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'payments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Add missing columns to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS transaction_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('credits', 'subscription'));
ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway TEXT NOT NULL DEFAULT 'phonepe';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway_response JSONB DEFAULT '{}';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS plan_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Update existing records to have default values
UPDATE payments SET 
  gateway = 'phonepe' WHERE gateway IS NULL,
  gateway_response = '{}' WHERE gateway_response IS NULL,
  type = 'credits' WHERE type IS NULL;

-- Add constraints after updating data
ALTER TABLE payments ALTER COLUMN gateway SET NOT NULL;
ALTER TABLE payments ALTER COLUMN type SET NOT NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_gateway ON payments(gateway);
CREATE INDEX IF NOT EXISTS idx_payments_type ON payments(type);

-- Verify the structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'payments' 
AND table_schema = 'public'
ORDER BY ordinal_position;
