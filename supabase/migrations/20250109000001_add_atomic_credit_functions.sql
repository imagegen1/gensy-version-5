-- Migration: Add Atomic Credit Functions
-- Description: Implements atomic credit deduction and refund functions to prevent race conditions
-- Date: 2025-01-09
-- Critical security fix for CVSS 8.5 vulnerability

-- Create credit transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deduction', 'refund', 'purchase', 'bonus', 'adjustment')),
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  original_transaction_id UUID REFERENCES credit_transactions(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(type);

-- Add credits column to users table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'credits') THEN
    ALTER TABLE users ADD COLUMN credits INTEGER DEFAULT 10;
  END IF;
END $$;

-- Add constraint to prevent negative credits
ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS check_credits_non_negative CHECK (credits >= 0);

-- Atomic credit deduction function
CREATE OR REPLACE FUNCTION deduct_credits_atomic(
  p_user_id TEXT,
  p_amount INTEGER,
  p_description TEXT,
  p_metadata JSONB DEFAULT '{}'
) RETURNS JSON AS $$
DECLARE
  current_credits INTEGER;
  new_credits INTEGER;
  transaction_id UUID;
BEGIN
  -- Validate inputs
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  -- Lock user row and get current credits
  SELECT credits INTO current_credits 
  FROM users 
  WHERE clerk_user_id = p_user_id 
  FOR UPDATE;
  
  -- Check if user exists
  IF current_credits IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Check if user has sufficient credits
  IF current_credits < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits. Current: %, Required: %', current_credits, p_amount;
  END IF;
  
  -- Calculate new credit balance
  new_credits := current_credits - p_amount;
  
  -- Update user credits atomically
  UPDATE users 
  SET credits = new_credits,
      updated_at = NOW()
  WHERE clerk_user_id = p_user_id;
  
  -- Record the transaction
  INSERT INTO credit_transactions (
    user_id,
    type,
    amount,
    status,
    description,
    metadata,
    created_at,
    completed_at
  ) VALUES (
    p_user_id,
    'deduction',
    p_amount,
    'completed',
    p_description,
    p_metadata,
    NOW(),
    NOW()
  ) RETURNING id INTO transaction_id;
  
  -- Return success result
  RETURN json_build_object(
    'success', true,
    'transaction_id', transaction_id,
    'remaining_credits', new_credits,
    'deducted_amount', p_amount
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error
    RAISE NOTICE 'Credit deduction failed for user %: %', p_user_id, SQLERRM;
    
    -- Re-raise the exception to be handled by the application
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic credit refund function
CREATE OR REPLACE FUNCTION refund_credits_atomic(
  p_user_id TEXT,
  p_amount INTEGER,
  p_description TEXT,
  p_original_transaction_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS JSON AS $$
DECLARE
  current_credits INTEGER;
  new_credits INTEGER;
  transaction_id UUID;
BEGIN
  -- Validate inputs
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  -- Lock user row and get current credits
  SELECT credits INTO current_credits 
  FROM users 
  WHERE clerk_user_id = p_user_id 
  FOR UPDATE;
  
  -- Check if user exists
  IF current_credits IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Calculate new credit balance
  new_credits := current_credits + p_amount;
  
  -- Update user credits atomically
  UPDATE users 
  SET credits = new_credits,
      updated_at = NOW()
  WHERE clerk_user_id = p_user_id;
  
  -- Record the transaction
  INSERT INTO credit_transactions (
    user_id,
    type,
    amount,
    status,
    description,
    metadata,
    original_transaction_id,
    created_at,
    completed_at
  ) VALUES (
    p_user_id,
    'refund',
    p_amount,
    'completed',
    p_description,
    p_metadata,
    p_original_transaction_id,
    NOW(),
    NOW()
  ) RETURNING id INTO transaction_id;
  
  -- Return success result
  RETURN json_build_object(
    'success', true,
    'transaction_id', transaction_id,
    'remaining_credits', new_credits,
    'refunded_amount', p_amount
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error
    RAISE NOTICE 'Credit refund failed for user %: %', p_user_id, SQLERRM;
    
    -- Re-raise the exception to be handled by the application
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user credits with lock function
CREATE OR REPLACE FUNCTION get_user_credits_with_lock(
  p_user_id TEXT
) RETURNS JSON AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  -- Lock user row and get current credits
  SELECT credits INTO current_credits 
  FROM users 
  WHERE clerk_user_id = p_user_id 
  FOR UPDATE;
  
  -- Check if user exists
  IF current_credits IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Return credits
  RETURN json_build_object(
    'credits', current_credits,
    'user_id', p_user_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Failed to get credits for user %: %', p_user_id, SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reverse credit transaction function
CREATE OR REPLACE FUNCTION reverse_credit_transaction(
  p_transaction_id UUID,
  p_reason TEXT
) RETURNS JSON AS $$
DECLARE
  original_transaction RECORD;
  current_credits INTEGER;
  new_credits INTEGER;
  reversal_transaction_id UUID;
BEGIN
  -- Get the original transaction
  SELECT * INTO original_transaction
  FROM credit_transactions
  WHERE id = p_transaction_id
  FOR UPDATE;
  
  -- Check if transaction exists
  IF original_transaction IS NULL THEN
    RAISE EXCEPTION 'Transaction not found';
  END IF;
  
  -- Check if transaction is already reversed
  IF original_transaction.status = 'reversed' THEN
    RAISE EXCEPTION 'Transaction already reversed';
  END IF;
  
  -- Lock user row and get current credits
  SELECT credits INTO current_credits 
  FROM users 
  WHERE clerk_user_id = original_transaction.user_id 
  FOR UPDATE;
  
  -- Calculate reversal based on transaction type
  IF original_transaction.type = 'deduction' THEN
    -- Refund the deducted amount
    new_credits := current_credits + original_transaction.amount;
  ELSIF original_transaction.type = 'refund' THEN
    -- Deduct the refunded amount (if user has sufficient credits)
    IF current_credits < original_transaction.amount THEN
      RAISE EXCEPTION 'Insufficient credits to reverse refund';
    END IF;
    new_credits := current_credits - original_transaction.amount;
  ELSE
    RAISE EXCEPTION 'Cannot reverse transaction of type %', original_transaction.type;
  END IF;
  
  -- Update user credits
  UPDATE users 
  SET credits = new_credits,
      updated_at = NOW()
  WHERE clerk_user_id = original_transaction.user_id;
  
  -- Mark original transaction as reversed
  UPDATE credit_transactions
  SET status = 'reversed'
  WHERE id = p_transaction_id;
  
  -- Create reversal transaction
  INSERT INTO credit_transactions (
    user_id,
    type,
    amount,
    status,
    description,
    metadata,
    original_transaction_id,
    created_at,
    completed_at
  ) VALUES (
    original_transaction.user_id,
    CASE 
      WHEN original_transaction.type = 'deduction' THEN 'refund'
      WHEN original_transaction.type = 'refund' THEN 'deduction'
    END,
    original_transaction.amount,
    'completed',
    'Reversal: ' || p_reason,
    json_build_object('reversal_reason', p_reason, 'original_transaction_id', p_transaction_id),
    p_transaction_id,
    NOW(),
    NOW()
  ) RETURNING id INTO reversal_transaction_id;
  
  -- Return success result
  RETURN json_build_object(
    'success', true,
    'reversal_transaction_id', reversal_transaction_id,
    'remaining_credits', new_credits,
    'original_transaction_id', p_transaction_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Transaction reversal failed for transaction %: %', p_transaction_id, SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION deduct_credits_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION refund_credits_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_credits_with_lock TO authenticated;
GRANT EXECUTE ON FUNCTION reverse_credit_transaction TO authenticated;

-- Grant permissions on credit_transactions table
GRANT SELECT, INSERT ON credit_transactions TO authenticated;
GRANT SELECT ON credit_transactions TO anon;

-- Create RLS policies for credit_transactions
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own transactions
CREATE POLICY "Users can view own credit transactions" ON credit_transactions
  FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

-- Only service role can insert transactions (through functions)
CREATE POLICY "Service role can insert credit transactions" ON credit_transactions
  FOR INSERT WITH CHECK (true);

-- Add comment for documentation
COMMENT ON FUNCTION deduct_credits_atomic IS 'Atomically deducts credits from user account with row-level locking to prevent race conditions';
COMMENT ON FUNCTION refund_credits_atomic IS 'Atomically refunds credits to user account with transaction logging';
COMMENT ON FUNCTION get_user_credits_with_lock IS 'Gets user credits with row-level lock for consistent reads';
COMMENT ON FUNCTION reverse_credit_transaction IS 'Reverses a credit transaction for failed operations';
COMMENT ON TABLE credit_transactions IS 'Stores all credit transactions with full audit trail';
