/**
 * Add Missing Columns to Payments Table
 * 
 * This script directly adds the missing gateway and gateway_response columns
 * to fix the PhonePe payment error.
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

async function addMissingColumns() {
  console.log('🔧 Adding missing columns to payments table...');
  
  try {
    // Add gateway column
    console.log('📝 Adding gateway column...');
    const { error: gatewayError } = await supabase
      .rpc('sql', {
        query: `ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway TEXT NOT NULL DEFAULT 'phonepe';`
      });
    
    if (gatewayError) {
      console.error('❌ Error adding gateway column:', gatewayError);
    } else {
      console.log('✅ Gateway column added successfully');
    }
    
    // Add gateway_response column
    console.log('📝 Adding gateway_response column...');
    const { error: responseError } = await supabase
      .rpc('sql', {
        query: `ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway_response JSONB DEFAULT '{}';`
      });
    
    if (responseError) {
      console.error('❌ Error adding gateway_response column:', responseError);
    } else {
      console.log('✅ Gateway_response column added successfully');
    }
    
  } catch (error) {
    console.error('❌ Error in addMissingColumns:', error);
  }
}

async function testPaymentsInsert() {
  console.log('🧪 Testing payments table insert...');
  
  try {
    const testPayment = {
      user_id: '00000000-0000-0000-0000-000000000000',
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
      return false;
    } else {
      console.log('✅ Test insert successful:', data[0].id);
      
      // Clean up
      await supabase
        .from('payments')
        .delete()
        .eq('id', data[0].id);
      
      console.log('🧹 Test record cleaned up');
      return true;
    }
  } catch (error) {
    console.error('❌ Error in testPaymentsInsert:', error);
    return false;
  }
}

// Alternative approach using direct SQL execution
async function executeSQL(sql, description) {
  console.log(`📝 ${description}...`);
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql })
    });
    
    if (response.ok) {
      console.log(`✅ ${description} completed successfully`);
      return true;
    } else {
      const error = await response.text();
      console.error(`❌ ${description} failed:`, error);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error in ${description}:`, error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting to add missing columns...');
  console.log('📡 Supabase URL:', supabaseUrl);
  
  // Try the RPC approach first
  await addMissingColumns();
  
  // Test if it worked
  const testResult = await testPaymentsInsert();
  
  if (!testResult) {
    console.log('⚠️ RPC approach failed, trying direct SQL...');
    
    // Try direct SQL approach
    await executeSQL(
      `ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway TEXT NOT NULL DEFAULT 'phonepe';`,
      'Adding gateway column via direct SQL'
    );
    
    await executeSQL(
      `ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway_response JSONB DEFAULT '{}';`,
      'Adding gateway_response column via direct SQL'
    );
    
    // Test again
    await testPaymentsInsert();
  }
  
  console.log('✅ Script completed!');
}

main().catch(console.error);
