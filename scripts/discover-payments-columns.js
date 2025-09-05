/**
 * Discover Payments Table Columns
 * 
 * This script tries to discover what columns actually exist in the payments table
 * by attempting different column combinations.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Common column names to test
const commonColumns = [
  'id',
  'user_id', 
  'clerk_user_id',
  'amount',
  'currency',
  'type',
  'status',
  'gateway',
  'gateway_response',
  'transaction_id',
  'merchant_transaction_id',
  'payment_id',
  'plan_id',
  'created_at',
  'updated_at',
  'completed_at'
];

async function discoverColumns() {
  console.log('🔍 Discovering payments table columns...');
  
  const existingColumns = [];
  
  for (const column of commonColumns) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(column)
        .limit(1);
      
      if (!error) {
        existingColumns.push(column);
        console.log(`✅ Column exists: ${column}`);
      } else {
        console.log(`❌ Column missing: ${column}`);
      }
    } catch (error) {
      console.log(`❌ Column missing: ${column} (${error.message})`);
    }
  }
  
  console.log('\n📊 Summary of existing columns:');
  existingColumns.forEach(col => console.log(`  - ${col}`));
  
  return existingColumns;
}

async function tryMinimalInsert(existingColumns) {
  console.log('\n🧪 Testing minimal insert with existing columns...');
  
  // Build insert object with only existing columns
  const insertData = {};
  
  if (existingColumns.includes('user_id')) {
    insertData.user_id = '799a9d93-5b35-435c-a208-a71d55a81674'; // From previous check
  }
  
  if (existingColumns.includes('clerk_user_id')) {
    insertData.clerk_user_id = 'user_test_' + Date.now();
  }
  
  if (existingColumns.includes('amount')) {
    insertData.amount = 10.00;
  }
  
  if (existingColumns.includes('type')) {
    insertData.type = 'credits';
  }
  
  if (existingColumns.includes('status')) {
    insertData.status = 'pending';
  }
  
  if (existingColumns.includes('currency')) {
    insertData.currency = 'INR';
  }
  
  if (existingColumns.includes('transaction_id')) {
    insertData.transaction_id = 'TEST_' + Date.now();
  }
  
  if (existingColumns.includes('merchant_transaction_id')) {
    insertData.merchant_transaction_id = 'TEST_' + Date.now();
  }
  
  if (existingColumns.includes('payment_id')) {
    insertData.payment_id = 'TEST_' + Date.now();
  }
  
  console.log('📝 Attempting insert with data:', insertData);
  
  try {
    const { data, error } = await supabase
      .from('payments')
      .insert(insertData)
      .select();
    
    if (error) {
      console.error('❌ Insert failed:', error);
    } else {
      console.log('✅ Insert successful:', data[0]);
      
      // Clean up
      if (data[0] && data[0].id) {
        await supabase.from('payments').delete().eq('id', data[0].id);
        console.log('🧹 Test record cleaned up');
      }
    }
  } catch (error) {
    console.error('❌ Insert error:', error);
  }
}

async function checkTableSchema() {
  console.log('\n🔍 Checking table schema via pg_attribute...');
  
  try {
    // This might not work due to RLS, but worth trying
    const { data, error } = await supabase
      .rpc('get_table_columns', { table_name: 'payments' });
    
    if (error) {
      console.log('❌ Schema check failed:', error.message);
    } else {
      console.log('✅ Schema data:', data);
    }
  } catch (error) {
    console.log('❌ Schema check error:', error.message);
  }
}

async function main() {
  console.log('🚀 Starting payments table column discovery...');
  
  const existingColumns = await discoverColumns();
  
  if (existingColumns.length > 0) {
    await tryMinimalInsert(existingColumns);
  } else {
    console.log('❌ No columns found - table might not exist or have access issues');
  }
  
  await checkTableSchema();
  
  console.log('\n✅ Discovery completed!');
}

main().catch(console.error);
