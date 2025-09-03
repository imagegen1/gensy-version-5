-- Create payments table for tracking payment transactions
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    transaction_id TEXT NOT NULL UNIQUE, -- PhonePe merchant transaction ID
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    type TEXT NOT NULL CHECK (type IN ('credits', 'subscription')),
    plan_id TEXT, -- For subscription payments
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    gateway TEXT NOT NULL DEFAULT 'phonepe',
    gateway_response JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- Create credit_transactions table for tracking credit purchases and usage
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- Positive for credits added, negative for credits used
    type TEXT NOT NULL CHECK (type IN ('purchase', 'usage', 'bonus', 'refund')),
    description TEXT,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    generation_id UUID, -- Reference to generations table if applicable
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for credit_transactions
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_payment_id ON credit_transactions(payment_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON payments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payments table
CREATE POLICY "Users can view their own payments" ON payments
    FOR SELECT USING (user_id IN (
        SELECT id FROM profiles WHERE clerk_user_id = auth.jwt() ->> 'sub'
    ));

CREATE POLICY "Service role can manage all payments" ON payments
    FOR ALL USING (auth.role() = 'service_role');

-- Create RLS policies for credit_transactions table
CREATE POLICY "Users can view their own credit transactions" ON credit_transactions
    FOR SELECT USING (user_id IN (
        SELECT id FROM profiles WHERE clerk_user_id = auth.jwt() ->> 'sub'
    ));

CREATE POLICY "Service role can manage all credit transactions" ON credit_transactions
    FOR ALL USING (auth.role() = 'service_role');

-- Create view for user payment history
CREATE OR REPLACE VIEW user_payment_history AS
SELECT 
    p.id,
    p.transaction_id,
    p.amount,
    p.currency,
    p.type,
    p.plan_id,
    p.status,
    p.gateway,
    p.created_at,
    p.completed_at,
    pr.clerk_user_id
FROM payments p
JOIN profiles pr ON p.user_id = pr.id;

-- Create view for user credit balance
CREATE OR REPLACE VIEW user_credit_balance AS
SELECT 
    pr.clerk_user_id,
    pr.id as user_id,
    COALESCE(SUM(ct.amount), 0) as total_credits
FROM profiles pr
LEFT JOIN credit_transactions ct ON pr.id = ct.user_id
GROUP BY pr.id, pr.clerk_user_id;

-- Grant permissions
GRANT SELECT ON user_payment_history TO authenticated;
GRANT SELECT ON user_credit_balance TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE payments IS 'Stores payment transaction records from various payment gateways';
COMMENT ON TABLE credit_transactions IS 'Tracks all credit additions and deductions for users';
COMMENT ON VIEW user_payment_history IS 'User-accessible view of payment history';
COMMENT ON VIEW user_credit_balance IS 'Real-time view of user credit balances';
