/**
 * Simple bucket creation using gsutil command
 */

const { execSync } = require('child_process');

try {
  console.log('🗂️ Creating GCS bucket using gsutil...');
  
  // Set the service account key
  process.env.GOOGLE_APPLICATION_CREDENTIALS = './sprint/gensy-final-464206-1327695f628d.json';

  // Try to create the bucket
  const command = 'gsutil mb -p gensy-final-464206 -c STANDARD -l us-central1 gs://gensy-final';
  
  console.log('🚀 Running command:', command);
  
  const result = execSync(command, { encoding: 'utf8' });
  console.log('✅ Bucket created successfully!');
  console.log(result);
  
} catch (error) {
  console.error('❌ Error creating bucket:', error.message);
  
  if (error.message.includes('already exists')) {
    console.log('✅ Bucket already exists - that\'s fine!');
  } else if (error.message.includes('gsutil')) {
    console.log('🔧 gsutil not found. Please create the bucket manually:');
    console.log('   1. Go to Google Cloud Console');
    console.log('   2. Navigate to Cloud Storage');
    console.log('   3. Create bucket with name: gensy-final');
    console.log('   4. Location: us-central1');
    console.log('   5. Storage class: Standard');
  }
}
