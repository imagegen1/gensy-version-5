/**
 * Setup CORS configuration for Cloudflare R2 bucket
 * This script configures the R2 bucket to allow browser access to images
 */

const { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } = require('@aws-sdk/client-s3')
require('dotenv').config({ path: '.env.local' })

// Create R2 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
})

const corsConfiguration = {
  CORSRules: [
    {
      ID: 'AllowBrowserAccess',
      AllowedHeaders: ['*'],
      AllowedMethods: ['GET', 'HEAD'],
      AllowedOrigins: [
        'http://localhost:3000',
        'https://localhost:3000',
        'https://*.vercel.app',
        'https://*.netlify.app',
        'https://gensy.ai',
        'https://*.gensy.ai'
      ],
      ExposeHeaders: [
        'ETag',
        'Content-Length',
        'Content-Type',
        'Last-Modified'
      ],
      MaxAgeSeconds: 3600
    },
    {
      ID: 'AllowSignedUrls',
      AllowedHeaders: ['*'],
      AllowedMethods: ['GET', 'HEAD'],
      AllowedOrigins: ['*'],
      ExposeHeaders: [
        'ETag',
        'Content-Length',
        'Content-Type',
        'Last-Modified'
      ],
      MaxAgeSeconds: 3600
    }
  ]
}

async function setupCORS() {
  try {
    console.log('🔧 Setting up CORS configuration for R2 bucket...')
    
    // Check current CORS configuration
    try {
      const currentCors = await r2Client.send(new GetBucketCorsCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME
      }))
      console.log('📋 Current CORS configuration:', JSON.stringify(currentCors.CORSRules, null, 2))
    } catch (error) {
      if (error.name === 'NoSuchCORSConfiguration') {
        console.log('📋 No existing CORS configuration found')
      } else {
        console.log('⚠️ Could not retrieve current CORS configuration:', error.message)
      }
    }

    // Apply new CORS configuration
    const command = new PutBucketCorsCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      CORSConfiguration: corsConfiguration
    })

    await r2Client.send(command)
    console.log('✅ CORS configuration applied successfully!')
    
    // Verify the configuration
    const verifyCommand = new GetBucketCorsCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME
    })
    
    const result = await r2Client.send(verifyCommand)
    console.log('🔍 Verified CORS configuration:')
    console.log(JSON.stringify(result.CORSRules, null, 2))
    
  } catch (error) {
    console.error('❌ Failed to setup CORS:', error)
    process.exit(1)
  }
}

// Run the setup
setupCORS()
