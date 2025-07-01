/**
 * List all available GCS buckets in the project
 */

const { Storage } = require('@google-cloud/storage');

async function listBuckets() {
  try {
    console.log('🗂️ Listing all GCS buckets in project...');
    
    // Initialize Google Cloud Storage with service account
    const storage = new Storage({
      projectId: 'gensy-final-464206',
      keyFilename: './sprint/gensy-final-464206-1327695f628d.json'
    });

    // List all buckets
    const [buckets] = await storage.getBuckets();
    
    console.log(`📁 Found ${buckets.length} buckets:`);
    
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name}`);
    });
    
    // Check if any bucket could be used for video outputs
    const videoBuckets = buckets.filter(bucket => 
      bucket.name.includes('video') || 
      bucket.name.includes('gensy') ||
      bucket.name.includes('output')
    );
    
    if (videoBuckets.length > 0) {
      console.log('\n🎯 Potential buckets for video outputs:');
      videoBuckets.forEach(bucket => {
        console.log(`  - ${bucket.name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error listing buckets:', error.message);
  }
}

listBuckets();
