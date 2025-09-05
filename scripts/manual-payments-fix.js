/**
 * Manual Payments Table Fix
 * 
 * Since we can't run raw SQL through Supabase RPC, let's try to fix this
 * by recreating the payments table with the correct structure.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function backupExistingPayments() {
  console.log('💾 Backing up existing payments data...');
  
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*');
    
    if (error) {
      console.error('❌ Error backing up payments:', error);
      return [];
    }
    
    console.log(`✅ Backed up ${data.length} payment records`);
    return data;
  } catch (error) {
    console.error('❌ Error in backupExistingPayments:', error);
    return [];
  }
}

async function dropPaymentsTable() {
  console.log('🗑️ Attempting to drop payments table...');
  
  // We can't drop tables through the REST API, so let's skip this
  console.log('⚠️ Cannot drop table through REST API - will work with existing structure');
  return true;
}

async function createPaymentsTableWithCorrectStructure() {
  console.log('🏗️ Creating payments table with correct structure...');
  
  // Since we can't run DDL through the REST API, let's try a different approach
  // Let's see if we can use the migration system
  
  console.log('⚠️ Cannot create table through REST API - need to use Supabase dashboard');
  return false;
}

async function tryAlternativeApproach() {
  console.log('🔄 Trying alternative approach - using existing table structure...');
  
  // Let's see what the current table structure actually is
  const { data: existingData } = await supabase
    .from('payments')
    .select('*')
    .limit(1);
  
  console.log('Current table has these columns:', existingData ? Object.keys(existingData[0] || {}) : 'No data');
  
  // Let's try to insert a payment record with only the columns that exist
  try {
    const testPayment = {
      user_id: '799a9d93-5b35-435c-a208-a71d55a81674',
      amount: 10.00,
      status: 'pending'
    };
    
    console.log('📝 Testing insert with minimal data:', testPayment);
    
    const { data, error } = await supabase
      .from('payments')
      .insert(testPayment)
      .select();
    
    if (error) {
      console.error('❌ Minimal insert failed:', error);
      return false;
    } else {
      console.log('✅ Minimal insert successful:', data[0]);
      
      // Clean up
      await supabase.from('payments').delete().eq('id', data[0].id);
      console.log('🧹 Test record cleaned up');
      
      return true;
    }
  } catch (error) {
    console.error('❌ Error in alternative approach:', error);
    return false;
  }
}

async function createManualSQLScript() {
  console.log('📝 Creating manual SQL script for Supabase dashboard...');
  
  const sqlScript = `
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
`;
  
  // Write the SQL script to a file
  const fs = require('fs');
  const path = require('path');
  
  const scriptPath = path.join(__dirname, 'fix-payments-table.sql');
  fs.writeFileSync(scriptPath, sqlScript);
  
  console.log(`✅ SQL script created at: ${scriptPath}`);
  console.log('📋 Please run this script in the Supabase SQL Editor:');
  console.log('   1. Go to https://supabase.com/dashboard');
  console.log('   2. Select your project');
  console.log('   3. Go to SQL Editor');
  console.log('   4. Paste and run the SQL script');
  
  return scriptPath;
}

async function main() {
  console.log('🚀 Starting manual payments table fix...');
  
  // Step 1: Backup existing data
  const backupData = await backupExistingPayments();
  
  // Step 2: Try alternative approach with existing structure
  const alternativeWorked = await tryAlternativeApproach();
  
  if (alternativeWorked) {
    console.log('✅ Alternative approach worked - table has basic functionality');
  } else {
    console.log('❌ Alternative approach failed');
  }
  
  // Step 3: Create manual SQL script
  const scriptPath = await createManualSQLScript();
  
  console.log('\n🎯 SOLUTION:');
  console.log('The payments table is missing required columns.');
  console.log('Since we cannot run DDL through the REST API, you need to:');
  console.log('');
  console.log('1. Open Supabase Dashboard: https://supabase.com/dashboard');
  console.log('2. Go to SQL Editor');
  console.log('3. Run the SQL script created at:', scriptPath);
  console.log('');
  console.log('This will add the missing columns:');
  console.log('- transaction_id (TEXT)');
  console.log('- type (TEXT with CHECK constraint)');
  console.log('- gateway (TEXT NOT NULL DEFAULT \'phonepe\')');
  console.log('- gateway_response (JSONB DEFAULT \'{}\')');
  console.log('- plan_id (TEXT)');
  console.log('- completed_at (TIMESTAMPTZ)');
  
  console.log('\n✅ Manual fix script completed!');
}

main().catch(console.error);
