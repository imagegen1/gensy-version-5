/**
 * Migration script to convert signed URLs to GCS paths in the database
 * This fixes the expired signed URL issue by storing GCS paths instead
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Helper function to extract GCS path from signed URL
function extractGcsPath(url) {
  try {
    // Handle different GCS URL formats:
    // 1. https://storage.googleapis.com/bucket-name/path/to/file?X-Goog-Algorithm=...
    // 2. https://storage.cloud.google.com/bucket-name/path/to/file?X-Goog-Algorithm=...
    
    const urlObj = new URL(url)
    
    if (urlObj.hostname === 'storage.googleapis.com' || urlObj.hostname === 'storage.cloud.google.com') {
      const pathParts = urlObj.pathname.substring(1).split('/') // Remove leading '/'
      if (pathParts.length < 2) return null
      
      const bucket = pathParts[0]
      const filePath = pathParts.slice(1).join('/')
      
      return {
        bucket,
        filePath,
        gcsPath: `gs://${bucket}/${filePath}`
      }
    }
    
    return null
  } catch (error) {
    console.error('Error extracting GCS path from URL:', url, error)
    return null
  }
}

async function migrateVideoUrls() {
  console.log('🔄 Starting video URL migration...')
  
  try {
    // Get all video generations with result_url
    console.log('📋 Fetching video generations from database...')
    const { data: generations, error } = await supabase
      .from('generations')
      .select('id, result_url, type, status')
      .eq('type', 'video')
      .not('result_url', 'is', null)
    
    if (error) {
      throw new Error(`Failed to fetch generations: ${error.message}`)
    }
    
    console.log(`📊 Found ${generations.length} video generations`)
    
    let migratedCount = 0
    let skippedCount = 0
    let errorCount = 0
    
    for (const generation of generations) {
      const { id, result_url, status } = generation
      
      // Skip if already a GCS path
      if (result_url.startsWith('gs://')) {
        console.log(`⏭️  Skipping ${id}: Already a GCS path`)
        skippedCount++
        continue
      }
      
      // Skip if not a GCS signed URL
      if (!result_url.includes('storage.googleapis.com') && !result_url.includes('storage.cloud.google.com')) {
        console.log(`⏭️  Skipping ${id}: Not a GCS URL (${result_url.substring(0, 50)}...)`)
        skippedCount++
        continue
      }
      
      // Extract GCS path
      const gcsInfo = extractGcsPath(result_url)
      if (!gcsInfo) {
        console.error(`❌ Failed to extract GCS path from: ${result_url}`)
        errorCount++
        continue
      }
      
      console.log(`🔄 Migrating ${id}: ${gcsInfo.bucket}/${gcsInfo.filePath}`)
      
      // Update the database record
      const { error: updateError } = await supabase
        .from('generations')
        .update({
          result_url: gcsInfo.gcsPath,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
      
      if (updateError) {
        console.error(`❌ Failed to update ${id}:`, updateError.message)
        errorCount++
        continue
      }
      
      // Also update media_files table if it exists
      const { data: mediaFiles } = await supabase
        .from('media_files')
        .select('id, file_path')
        .eq('generation_id', id)
      
      if (mediaFiles && mediaFiles.length > 0) {
        for (const mediaFile of mediaFiles) {
          if (mediaFile.file_path && mediaFile.file_path === result_url) {
            await supabase
              .from('media_files')
              .update({
                file_path: gcsInfo.gcsPath,
                updated_at: new Date().toISOString()
              })
              .eq('id', mediaFile.id)
            
            console.log(`📁 Updated media file ${mediaFile.id}`)
          }
        }
      }
      
      migratedCount++
      console.log(`✅ Successfully migrated ${id}`)
    }
    
    console.log('\n📊 Migration Summary:')
    console.log(`✅ Migrated: ${migratedCount}`)
    console.log(`⏭️  Skipped: ${skippedCount}`)
    console.log(`❌ Errors: ${errorCount}`)
    console.log(`📋 Total: ${generations.length}`)
    
    if (migratedCount > 0) {
      console.log('\n🎉 Migration completed successfully!')
      console.log('🔄 The video proxy will now generate fresh signed URLs for all videos.')
    } else {
      console.log('\n💡 No videos needed migration.')
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run the migration
if (require.main === module) {
  migrateVideoUrls()
    .then(() => {
      console.log('✅ Migration script completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error)
      process.exit(1)
    })
}

module.exports = { migrateVideoUrls, extractGcsPath }
