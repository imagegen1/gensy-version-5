-- Database Functions for Gensy AI Creative Suite
-- Custom functions to handle business logic at the database level

-- Function to safely deduct credits from a user
CREATE OR REPLACE FUNCTION deduct_user_credits(
  p_user_id UUID,
  p_credits_to_deduct INTEGER,
  p_generation_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT 'Credit usage'
)
RETURNS BOOLEAN AS $$
DECLARE
  current_credits INTEGER;
  new_credits INTEGER;
BEGIN
  -- Get current credits with row lock
  SELECT credits INTO current_credits
  FROM users
  WHERE id = p_user_id
  FOR UPDATE;
  
  -- Check if user exists
  IF current_credits IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Check if user has enough credits
  IF current_credits < p_credits_to_deduct THEN
    RAISE EXCEPTION 'Insufficient credits. Current: %, Required: %', current_credits, p_credits_to_deduct;
  END IF;
  
  -- Calculate new credit balance
  new_credits := current_credits - p_credits_to_deduct;
  
  -- Update user credits
  UPDATE users
  SET credits = new_credits,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Log the transaction
  INSERT INTO credit_transactions (
    user_id,
    type,
    amount,
    description,
    generation_id
  ) VALUES (
    p_user_id,
    'usage',
    -p_credits_to_deduct,
    p_description,
    p_generation_id
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to add credits to a user
CREATE OR REPLACE FUNCTION add_user_credits(
  p_user_id UUID,
  p_credits_to_add INTEGER,
  p_payment_id TEXT DEFAULT NULL,
  p_description TEXT DEFAULT 'Credit purchase'
)
RETURNS BOOLEAN AS $$
DECLARE
  current_credits INTEGER;
  new_credits INTEGER;
BEGIN
  -- Get current credits with row lock
  SELECT credits INTO current_credits
  FROM users
  WHERE id = p_user_id
  FOR UPDATE;
  
  -- Check if user exists
  IF current_credits IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Calculate new credit balance
  new_credits := current_credits + p_credits_to_add;
  
  -- Update user credits
  UPDATE users
  SET credits = new_credits,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Log the transaction
  INSERT INTO credit_transactions (
    user_id,
    type,
    amount,
    description,
    payment_id
  ) VALUES (
    p_user_id,
    'purchase',
    p_credits_to_add,
    p_description,
    p_payment_id
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's generation statistics
CREATE OR REPLACE FUNCTION get_user_generation_stats(p_user_id UUID)
RETURNS TABLE(
  total_generations BIGINT,
  image_generations BIGINT,
  video_generations BIGINT,
  upscale_generations BIGINT,
  total_credits_used BIGINT,
  avg_processing_time DECIMAL,
  last_generation_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_generations,
    COUNT(*) FILTER (WHERE type = 'image') as image_generations,
    COUNT(*) FILTER (WHERE type = 'video') as video_generations,
    COUNT(*) FILTER (WHERE type = 'upscale') as upscale_generations,
    COALESCE(SUM(credits_used), 0) as total_credits_used,
    COALESCE(AVG(processing_time_seconds), 0) as avg_processing_time,
    MAX(created_at) as last_generation_date
  FROM generations
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's monthly usage
CREATE OR REPLACE FUNCTION get_user_monthly_usage(
  p_user_id UUID,
  p_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
  p_month INTEGER DEFAULT EXTRACT(MONTH FROM NOW())
)
RETURNS TABLE(
  generations_count BIGINT,
  credits_used BIGINT,
  images_generated BIGINT,
  videos_generated BIGINT,
  upscales_performed BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as generations_count,
    COALESCE(SUM(g.credits_used), 0) as credits_used,
    COUNT(*) FILTER (WHERE g.type = 'image') as images_generated,
    COUNT(*) FILTER (WHERE g.type = 'video') as videos_generated,
    COUNT(*) FILTER (WHERE g.type = 'upscale') as upscales_performed
  FROM generations g
  WHERE g.user_id = p_user_id
    AND EXTRACT(YEAR FROM g.created_at) = p_year
    AND EXTRACT(MONTH FROM g.created_at) = p_month;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old generation history
CREATE OR REPLACE FUNCTION cleanup_old_generation_history(p_days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM generation_history
  WHERE created_at < NOW() - INTERVAL '1 day' * p_days_to_keep;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get subscription status for a user
CREATE OR REPLACE FUNCTION get_user_subscription_status(p_user_id UUID)
RETURNS TABLE(
  has_active_subscription BOOLEAN,
  plan_name TEXT,
  credits_per_month INTEGER,
  current_period_end TIMESTAMP WITH TIME ZONE,
  days_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE WHEN us.status = 'active' AND us.current_period_end > NOW() THEN TRUE ELSE FALSE END as has_active_subscription,
    sp.name as plan_name,
    sp.credits_per_month,
    us.current_period_end,
    CASE 
      WHEN us.current_period_end > NOW() THEN 
        EXTRACT(DAYS FROM us.current_period_end - NOW())::INTEGER
      ELSE 0
    END as days_remaining
  FROM users u
  LEFT JOIN user_subscriptions us ON u.id = us.user_id AND us.status = 'active'
  LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
  WHERE u.id = p_user_id
  ORDER BY us.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to update generation completion
CREATE OR REPLACE FUNCTION complete_generation(
  p_generation_id UUID,
  p_result_url TEXT,
  p_processing_time_seconds INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE generations
  SET 
    status = 'completed',
    result_url = p_result_url,
    processing_time_seconds = p_processing_time_seconds,
    completed_at = NOW()
  WHERE id = p_generation_id;
  
  -- Check if update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Generation not found: %', p_generation_id;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to mark generation as failed
CREATE OR REPLACE FUNCTION fail_generation(
  p_generation_id UUID,
  p_error_message TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE generations
  SET 
    status = 'failed',
    error_message = p_error_message,
    completed_at = NOW()
  WHERE id = p_generation_id;
  
  -- Check if update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Generation not found: %', p_generation_id;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get platform statistics (admin only)
CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS TABLE(
  total_users BIGINT,
  active_users_last_30_days BIGINT,
  total_generations BIGINT,
  generations_last_24_hours BIGINT,
  total_credits_used BIGINT,
  total_revenue DECIMAL,
  avg_processing_time DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(DISTINCT user_id) FROM generations WHERE created_at > NOW() - INTERVAL '30 days') as active_users_last_30_days,
    (SELECT COUNT(*) FROM generations) as total_generations,
    (SELECT COUNT(*) FROM generations WHERE created_at > NOW() - INTERVAL '24 hours') as generations_last_24_hours,
    (SELECT COALESCE(SUM(credits_used), 0) FROM generations) as total_credits_used,
    (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed') as total_revenue,
    (SELECT COALESCE(AVG(processing_time_seconds), 0) FROM generations WHERE processing_time_seconds IS NOT NULL) as avg_processing_time;
END;
$$ LANGUAGE plpgsql;

-- Function to execute raw SQL (for migrations)
CREATE OR REPLACE FUNCTION exec_sql(sql TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
