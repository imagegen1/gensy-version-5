/**
 * Script to add 1000 credits to the user account
 * This script uses the existing credit management system
 */

const { createServiceRoleClient } = require('./src/lib/supabase/server')

async function addCreditsToUser() {
  try {
    console.log('🎯 Adding 1000 credits to user account...')
    
    const supabase = createServiceRoleClient()
    
    // Find the user (assuming there's only one user for testing)
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id, clerk_user_id, credits')
      .limit(1)
    
    if (userError) {
      console.error('❌ Error finding user:', userError)
      return
    }
    
    if (!users || users.length === 0) {
      console.error('❌ No users found in the database')
      return
    }
    
    const user = users[0]
    console.log(`👤 Found user: ${user.clerk_user_id}`)
    console.log(`💳 Current credits: ${user.credits}`)
    
    // Calculate new balance
    const newBalance = user.credits + 1000
    
    // Update user credits
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        credits: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
    
    if (updateError) {
      console.error('❌ Error updating credits:', updateError)
      return
    }
    
    // Log the transaction
    const { error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: user.id,
        type: 'bonus',
        amount: 1000,
        description: 'Bonus credits for video generation testing'
      })
    
    if (transactionError) {
      console.error('❌ Error logging transaction:', transactionError)
      return
    }
    
    console.log(`✅ Successfully added 1000 credits!`)
    console.log(`💳 New balance: ${newBalance} credits`)
    console.log(`📝 Transaction logged successfully`)
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the script
addCreditsToUser()
