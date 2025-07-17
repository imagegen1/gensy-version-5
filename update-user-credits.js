/**
 * Script to Update User Credits in Production
 * Updates credits for insightdigitech@gmail.com to 1000
 */

// Configuration
const PRODUCTION_URL = 'https://gensy-version-5.vercel.app' // Replace with your actual Vercel domain
const ADMIN_SECRET_KEY = 'gensy-admin-2024-secure-key' // Should match your environment variable
const TARGET_EMAIL = 'insightdigitech@gmail.com'
const NEW_CREDITS = 1000

async function updateUserCredits() {
  try {
    console.log('🚀 Starting credit update process...')
    console.log(`📧 Target user: ${TARGET_EMAIL}`)
    console.log(`💳 Setting credits to: ${NEW_CREDITS}`)
    console.log(`🌐 Production URL: ${PRODUCTION_URL}`)
    
    // First, check current user credits
    console.log('\n📊 Checking current user credits...')
    const checkResponse = await fetch(
      `${PRODUCTION_URL}/api/admin/update-credits?email=${encodeURIComponent(TARGET_EMAIL)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${ADMIN_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (checkResponse.ok) {
      const checkData = await checkResponse.json()
      console.log(`✅ Current credits: ${checkData.user.current_credits}`)
      console.log(`👤 User ID: ${checkData.user.clerk_user_id}`)
      console.log(`📅 Last updated: ${checkData.user.updated_at}`)
    } else {
      const errorData = await checkResponse.json()
      console.log(`⚠️ Could not check current credits: ${errorData.error}`)
    }

    // Update user credits
    console.log('\n🔄 Updating user credits...')
    const updateResponse = await fetch(
      `${PRODUCTION_URL}/api/admin/update-credits`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ADMIN_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: TARGET_EMAIL,
          credits: NEW_CREDITS,
          description: 'Admin bonus credits for production testing'
        })
      }
    )

    const updateData = await updateResponse.json()

    if (updateResponse.ok) {
      console.log('\n✅ SUCCESS! Credits updated successfully!')
      console.log(`📧 User: ${updateData.user.email}`)
      console.log(`💳 Previous credits: ${updateData.user.previous_credits}`)
      console.log(`💳 New credits: ${updateData.user.new_credits}`)
      console.log(`📈 Difference: ${updateData.user.difference > 0 ? '+' : ''}${updateData.user.difference}`)
      console.log(`📝 Message: ${updateData.message}`)
    } else {
      console.error('\n❌ FAILED to update credits!')
      console.error(`Error: ${updateData.error}`)
      console.error('Response:', updateData)
    }

  } catch (error) {
    console.error('\n💥 Script execution failed!')
    console.error('Error:', error.message)
    console.error('Make sure:')
    console.error('1. Your Vercel domain is correct')
    console.error('2. The admin API endpoint is deployed')
    console.error('3. The user exists in your database')
    console.error('4. Your internet connection is working')
  }
}

// Run the script
console.log('🎯 Gensy Credit Update Script')
console.log('==============================')
updateUserCredits()
