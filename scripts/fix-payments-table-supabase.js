/**
 * Fix Payments Table using Supabase Service Role Client
 * 
 * This script uses the existing Supabase utilities to fix the payments table
 * by adding the missing gateway and gateway_response columns.
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

async function checkCurrentPaymentsStructure() {
  console.log('🔍 Checking current payments table structure...');
  
  try {
    // Try to get a sample record to see current structure
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error querying payments table:', error);
      return null;
    }
    
    console.log('✅ Payments table exists');
    if (data && data.length > 0) {
      console.log('📊 Current structure (sample record):', Object.keys(data[0]));
    } else {
      console.log('📊 Table is empty, will test with insert');
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error in checkCurrentPaymentsStructure:', error);
    return null;
  }
}

async function testCurrentColumns() {
  console.log('🧪 Testing which columns exist...');
  
  const testColumns = [
    'id', 'user_id', 'transaction_id', 'amount', 'currency', 
    'type', 'status', 'gateway', 'gateway_response', 'plan_id',
    'created_at', 'updated_at', 'completed_at'
  ];
  
  const existingColumns = [];
  
  for (const column of testColumns) {
    try {
      const { error } = await supabase
        .from('payments')
        .select(column)
        .limit(1);
      
      if (!error) {
        existingColumns.push(column);
        console.log(`✅ ${column} exists`);
      } else {
        console.log(`❌ ${column} missing: ${error.message}`);
      }
    } catch (error) {
      console.log(`❌ ${column} missing: ${error.message}`);
    }
  }
  
  return existingColumns;
}

async function addMissingColumns() {
  console.log('🔧 Adding missing columns to payments table...');
  
  const alterQueries = [
    {
      name: 'gateway column',
      sql: `ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway TEXT NOT NULL DEFAULT 'phonepe';`
    },
    {
      name: 'gateway_response column', 
      sql: `ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway_response JSONB DEFAULT '{}';`
    },
    {
      name: 'transaction_id column (if missing)',
      sql: `ALTER TABLE payments ADD COLUMN IF NOT EXISTS transaction_id TEXT;`
    }
  ];
  
  for (const query of alterQueries) {
    try {
      console.log(`📝 Adding ${query.name}...`);
      
      // Execute raw SQL using the service role client
      const { error } = await supabase.rpc('exec', { sql: query.sql });
      
      if (error) {
        console.error(`❌ Failed to add ${query.name}:`, error);
        
        // Try alternative approach with direct query
        try {
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'apikey': supabaseServiceKey
            },
            body: JSON.stringify({ sql: query.sql })
          });
          
          if (response.ok) {
            console.log(`✅ ${query.name} added successfully (via direct API)`);
          } else {
            const errorText = await response.text();
            console.error(`❌ Direct API also failed for ${query.name}:`, errorText);
          }
        } catch (directError) {
          console.error(`❌ Direct API error for ${query.name}:`, directError);
        }
      } else {
        console.log(`✅ ${query.name} added successfully`);
      }
    } catch (error) {
      console.error(`❌ Error adding ${query.name}:`, error);
    }
  }
}

async function createPaymentsTableIfMissing() {
  console.log('🏗️ Creating payments table if it doesn\'t exist...');
  
  const createTableSQL = `
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
    
    -- Create indexes if they don't exist
    CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
    CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
    CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
    CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
  `;
  
  try {
    const { error } = await supabase.rpc('exec', { sql: createTableSQL });
    
    if (error) {
      console.error('❌ Failed to create payments table:', error);
    } else {
      console.log('✅ Payments table created/verified successfully');
    }
  } catch (error) {
    console.error('❌ Error creating payments table:', error);
  }
}

async function testPaymentInsert() {
  console.log('🧪 Testing payment record insertion...');
  
  try {
    // Get a real user ID from profiles table
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (!profiles || profiles.length === 0) {
      console.log('⚠️ No profiles found, skipping insert test');
      return;
    }
    
    const testPayment = {
      user_id: profiles[0].id,
      transaction_id: 'TEST_FIX_' + Date.now(),
      amount: 10.00,
      type: 'credits',
      gateway: 'phonepe',
      gateway_response: { test: true, fixed: true }
    };
    
    console.log('📝 Attempting to insert test payment:', testPayment);
    
    const { data, error } = await supabase
      .from('payments')
      .insert(testPayment)
      .select();
    
    if (error) {
      console.error('❌ Test payment insert failed:', error);
      return false;
    } else {
      console.log('✅ Test payment insert successful:', data[0].id);
      
      // Clean up test record
      await supabase
        .from('payments')
        .delete()
        .eq('id', data[0].id);
      
      console.log('🧹 Test record cleaned up');
      return true;
    }
  } catch (error) {
    console.error('❌ Error in testPaymentInsert:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting payments table fix using Supabase service role client...');
  console.log('📡 Supabase URL:', supabaseUrl);
  
  // Step 1: Check current structure
  await checkCurrentPaymentsStructure();
  
  // Step 2: Test which columns exist
  const existingColumns = await testCurrentColumns();
  
  // Step 3: Create table if it doesn't exist properly
  await createPaymentsTableIfMissing();
  
  // Step 4: Add missing columns
  await addMissingColumns();
  
  // Step 5: Test if the fix worked
  const testResult = await testPaymentInsert();
  
  if (testResult) {
    console.log('🎉 SUCCESS! Payments table is now working correctly');
    console.log('✅ PhonePe payment integration should now work');
  } else {
    console.log('❌ FAILED! Payments table still has issues');
    console.log('🔧 Manual intervention may be required');
  }
  
  console.log('✅ Fix script completed!');
}

main().catch(console.error);
