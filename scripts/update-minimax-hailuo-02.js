/**
 * Update MiniMax-Hailuo-02 model in database with correct capabilities and constraints
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function updateMinimaxHailuo02() {
  console.log('🔄 Updating MiniMax-Hailuo-02 model configuration...')

  try {
    // Update the MiniMax-Hailuo-02 model
    const { data, error } = await supabase
      .from('ai_models')
      .update({
        description: 'Latest MiniMax video generation model with SOTA instruction following and extreme physics mastery. Supports both text-to-video and image-to-video generation.',
        capabilities: ['text-to-video', 'image-to-video'],
        max_duration: 10,
        supported_aspect_ratios: ['16:9', '9:16', '1:1'],
        updated_at: new Date().toISOString()
      })
      .eq('name', 'MiniMax-Hailuo-02')
      .select()

    if (error) {
      console.error('❌ Error updating MiniMax-Hailuo-02:', error)
      return
    }

    if (data && data.length > 0) {
      console.log('✅ Successfully updated MiniMax-Hailuo-02 model:')
      console.log('   - Added image-to-video capability')
      console.log('   - Updated max duration to 10s')
      console.log('   - Updated aspect ratios: 16:9, 9:16, 1:1')
      console.log('   - Enhanced description with dual capabilities')
      console.log(`   - Model ID: ${data[0].id}`)
    } else {
      console.log('⚠️ No MiniMax-Hailuo-02 model found to update')
    }

  } catch (error) {
    console.error('❌ Failed to update MiniMax-Hailuo-02:', error)
  }
}

// Run the update
updateMinimaxHailuo02()
  .then(() => {
    console.log('🎉 Update process completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Update process failed:', error)
    process.exit(1)
  })
