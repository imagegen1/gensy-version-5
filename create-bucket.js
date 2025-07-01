/**
 * Create the GCS bucket for video outputs
 */

const { Storage } = require('@google-cloud/storage');

async function createBucket() {
  try {
    console.log('🗂️ Creating GCS bucket for video outputs...');
    
    // Initialize Google Cloud Storage with service account
    const storage = new Storage({
      projectId: 'gensy-final-464206',
      keyFilename: './sprint/gensy-final-464206-1327695f628d.json'
    });

    const bucketName = 'gensy-final';
    
    // Check if bucket already exists
    const [exists] = await storage.bucket(bucketName).exists();
    
    if (exists) {
      console.log(`✅ Bucket ${bucketName} already exists!`);
      return;
    }
    
    // Create the bucket
    const [bucket] = await storage.createBucket(bucketName, {
      location: 'us-central1',
      storageClass: 'STANDARD',
    });
    
    console.log(`✅ Bucket ${bucket.name} created successfully!`);
    console.log(`📍 Location: us-central1`);
    console.log(`🔧 Storage class: STANDARD`);
    
  } catch (error) {
    console.error('❌ Error creating bucket:', error);
    process.exit(1);
  }
}

createBucket();
