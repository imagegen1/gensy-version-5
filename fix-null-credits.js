/**
 * Fix Null Credits Script for Gensy AI Creative Suite
 * This script updates any users who have null credits to have 10 credits
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixNullCredits() {
  console.log('🔧 Starting to fix null credits...')
  
  try {
    // Find users with null credits
    const { data: usersWithNullCredits, error: fetchError } = await supabase
      .from('profiles')
      .select('id, clerk_user_id, email, credits')
      .is('credits', null)
    
    if (fetchError) {
      console.error('❌ Error fetching users with null credits:', fetchError)
      return
    }
    
    if (!usersWithNullCredits || usersWithNullCredits.length === 0) {
      console.log('✅ No users found with null credits. All good!')
      return
    }
    
    console.log(`📊 Found ${usersWithNullCredits.length} users with null credits:`)
    usersWithNullCredits.forEach(user => {
      console.log(`  - ${user.email} (${user.clerk_user_id})`)
    })
    
    // Update all users with null credits to have 10 credits
    const { data: updatedUsers, error: updateError } = await supabase
      .from('profiles')
      .update({ 
        credits: 10,
        updated_at: new Date().toISOString()
      })
      .is('credits', null)
      .select('id, email, credits')
    
    if (updateError) {
      console.error('❌ Error updating users:', updateError)
      return
    }
    
    console.log(`✅ Successfully updated ${updatedUsers.length} users with 10 credits:`)
    updatedUsers.forEach(user => {
      console.log(`  - ${user.email}: ${user.credits} credits`)
    })
    
    // Create credit transactions for these users
    const transactions = updatedUsers.map(user => ({
      user_id: user.id,
      type: 'bonus',
      amount: 10,
      description: 'Initial credits for new user'
    }))
    
    if (transactions.length > 0) {
      const { error: transactionError } = await supabase
        .from('credit_transactions')
        .insert(transactions)
      
      if (transactionError) {
        console.error('⚠️ Warning: Could not create credit transactions:', transactionError)
      } else {
        console.log(`📝 Created ${transactions.length} credit transaction records`)
      }
    }
    
    console.log('🎉 Credit fix completed successfully!')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the script
fixNullCredits()
  .then(() => {
    console.log('✅ Script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
