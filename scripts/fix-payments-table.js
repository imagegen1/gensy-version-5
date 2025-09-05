/**
 * Fix Payments Table Script
 * 
 * This script checks if the payments table exists with the correct schema
 * and creates/updates it if needed to fix the PhonePe payment error.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndFixPaymentsTable() {
  console.log('🔍 Checking payments table structure...');
  
  try {
    // Check if payments table exists
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'payments');
    
    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError);
      return;
    }
    
    if (!tables || tables.length === 0) {
      console.log('📋 Payments table does not exist. Creating...');
      await createPaymentsTable();
    } else {
      console.log('✅ Payments table exists. Checking columns...');
      await checkPaymentsColumns();
    }
    
  } catch (error) {
    console.error('❌ Error in checkAndFixPaymentsTable:', error);
  }
}

async function checkPaymentsColumns() {
  try {
    // Check columns in payments table
    const { data: columns, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_schema', 'public')
      .eq('table_name', 'payments')
      .order('ordinal_position');
    
    if (error) {
      console.error('❌ Error checking columns:', error);
      return;
    }
    
    console.log('📊 Current payments table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Check if gateway column exists
    const hasGateway = columns.some(col => col.column_name === 'gateway');
    
    if (!hasGateway) {
      console.log('⚠️ Missing gateway column. Adding...');
      await addGatewayColumn();
    } else {
      console.log('✅ Gateway column exists');
    }
    
    // Check if gateway_response column exists
    const hasGatewayResponse = columns.some(col => col.column_name === 'gateway_response');
    
    if (!hasGatewayResponse) {
      console.log('⚠️ Missing gateway_response column. Adding...');
      await addGatewayResponseColumn();
    } else {
      console.log('✅ Gateway_response column exists');
    }
    
  } catch (error) {
    console.error('❌ Error checking columns:', error);
  }
}

async function addGatewayColumn() {
  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway TEXT NOT NULL DEFAULT 'phonepe';`
    });
    
    if (error) {
      console.error('❌ Error adding gateway column:', error);
    } else {
      console.log('✅ Gateway column added successfully');
    }
  } catch (error) {
    console.error('❌ Error in addGatewayColumn:', error);
  }
}

async function addGatewayResponseColumn() {
  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway_response JSONB DEFAULT '{}';`
    });
    
    if (error) {
      console.error('❌ Error adding gateway_response column:', error);
    } else {
      console.log('✅ Gateway_response column added successfully');
    }
  } catch (error) {
    console.error('❌ Error in addGatewayResponseColumn:', error);
  }
}

async function createPaymentsTable() {
  try {
    const createTableSQL = `
      -- Create payments table for tracking payment transactions
      CREATE TABLE IF NOT EXISTS payments (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
          transaction_id TEXT NOT NULL UNIQUE,
          amount DECIMAL(10,2) NOT NULL,
          currency TEXT DEFAULT 'INR',
          type TEXT NOT NULL CHECK (type IN ('credits', 'subscription')),
          plan_id TEXT,
          status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
          gateway TEXT NOT NULL DEFAULT 'phonepe',
          gateway_response JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          completed_at TIMESTAMPTZ,
          updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
      CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
      CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
      CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
      
      -- Enable RLS
      ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
      
      -- Create RLS policies
      CREATE POLICY "Users can view their own payments" ON payments
          FOR SELECT USING (user_id IN (
              SELECT id FROM profiles WHERE clerk_user_id = auth.jwt() ->> 'sub'
          ));
      
      CREATE POLICY "Service role can manage all payments" ON payments
          FOR ALL USING (auth.role() = 'service_role');
    `;
    
    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (error) {
      console.error('❌ Error creating payments table:', error);
    } else {
      console.log('✅ Payments table created successfully');
    }
  } catch (error) {
    console.error('❌ Error in createPaymentsTable:', error);
  }
}

async function testPaymentsTable() {
  console.log('🧪 Testing payments table...');
  
  try {
    // Try to insert a test record
    const testPayment = {
      user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      transaction_id: 'TEST_' + Date.now(),
      amount: 10.00,
      type: 'credits',
      gateway: 'phonepe',
      gateway_response: { test: true }
    };
    
    const { data, error } = await supabase
      .from('payments')
      .insert(testPayment)
      .select();
    
    if (error) {
      console.error('❌ Test insert failed:', error);
    } else {
      console.log('✅ Test insert successful');
      
      // Clean up test record
      await supabase
        .from('payments')
        .delete()
        .eq('transaction_id', testPayment.transaction_id);
      
      console.log('🧹 Test record cleaned up');
    }
  } catch (error) {
    console.error('❌ Error in testPaymentsTable:', error);
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting payments table fix...');
  console.log('📡 Supabase URL:', supabaseUrl);
  
  await checkAndFixPaymentsTable();
  await testPaymentsTable();
  
  console.log('✅ Payments table fix completed!');
}

main().catch(console.error);
