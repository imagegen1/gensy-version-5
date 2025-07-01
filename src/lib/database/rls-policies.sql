-- Row Level Security (RLS) Policies for Gensy AI Creative Suite
-- These policies ensure users can only access their own data

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_analytics ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user ID from Clerk
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
BEGIN
  -- This function should return the user ID based on the authenticated user
  -- In practice, this will be handled by your application logic
  RETURN (SELECT id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users table policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (id = get_current_user_id());

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (id = get_current_user_id());

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

-- User subscriptions policies
CREATE POLICY "Users can view their own subscriptions" ON user_subscriptions
  FOR SELECT USING (user_id = get_current_user_id());

CREATE POLICY "Users can insert their own subscriptions" ON user_subscriptions
  FOR INSERT WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "Users can update their own subscriptions" ON user_subscriptions
  FOR UPDATE USING (user_id = get_current_user_id());

-- Generations table policies
CREATE POLICY "Users can view their own generations" ON generations
  FOR SELECT USING (user_id = get_current_user_id());

CREATE POLICY "Users can insert their own generations" ON generations
  FOR INSERT WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "Users can update their own generations" ON generations
  FOR UPDATE USING (user_id = get_current_user_id());

CREATE POLICY "Users can delete their own generations" ON generations
  FOR DELETE USING (user_id = get_current_user_id());

-- Media files policies
CREATE POLICY "Users can view their own media files" ON media_files
  FOR SELECT USING (user_id = get_current_user_id());

CREATE POLICY "Users can insert their own media files" ON media_files
  FOR INSERT WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "Users can update their own media files" ON media_files
  FOR UPDATE USING (user_id = get_current_user_id());

CREATE POLICY "Users can delete their own media files" ON media_files
  FOR DELETE USING (user_id = get_current_user_id());

-- Public media files can be viewed by anyone
CREATE POLICY "Public media files are viewable by everyone" ON media_files
  FOR SELECT USING (is_public = true);

-- Credit transactions policies
CREATE POLICY "Users can view their own credit transactions" ON credit_transactions
  FOR SELECT USING (user_id = get_current_user_id());

CREATE POLICY "Users can insert their own credit transactions" ON credit_transactions
  FOR INSERT WITH CHECK (user_id = get_current_user_id());

-- Payments policies
CREATE POLICY "Users can view their own payments" ON payments
  FOR SELECT USING (user_id = get_current_user_id());

CREATE POLICY "Users can insert their own payments" ON payments
  FOR INSERT WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "Users can update their own payments" ON payments
  FOR UPDATE USING (user_id = get_current_user_id());

-- Generation history policies
CREATE POLICY "Users can view their own generation history" ON generation_history
  FOR SELECT USING (user_id = get_current_user_id());

CREATE POLICY "Users can insert their own generation history" ON generation_history
  FOR INSERT WITH CHECK (user_id = get_current_user_id());

-- User preferences policies
CREATE POLICY "Users can view their own preferences" ON user_preferences
  FOR SELECT USING (user_id = get_current_user_id());

CREATE POLICY "Users can insert their own preferences" ON user_preferences
  FOR INSERT WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "Users can update their own preferences" ON user_preferences
  FOR UPDATE USING (user_id = get_current_user_id());

CREATE POLICY "Users can delete their own preferences" ON user_preferences
  FOR DELETE USING (user_id = get_current_user_id());

-- API keys policies
CREATE POLICY "Users can view their own API keys" ON api_keys
  FOR SELECT USING (user_id = get_current_user_id());

CREATE POLICY "Users can insert their own API keys" ON api_keys
  FOR INSERT WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "Users can update their own API keys" ON api_keys
  FOR UPDATE USING (user_id = get_current_user_id());

CREATE POLICY "Users can delete their own API keys" ON api_keys
  FOR DELETE USING (user_id = get_current_user_id());

-- Usage analytics policies
CREATE POLICY "Users can view their own usage analytics" ON usage_analytics
  FOR SELECT USING (user_id = get_current_user_id());

CREATE POLICY "Users can insert their own usage analytics" ON usage_analytics
  FOR INSERT WITH CHECK (user_id = get_current_user_id());

-- Subscription plans are readable by everyone (public information)
CREATE POLICY "Subscription plans are viewable by everyone" ON subscription_plans
  FOR SELECT USING (is_active = true);

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant permissions to service role for admin operations
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
