/**
 * R2 Connection Test API
 * Tests R2 bucket connectivity and credentials
 */

import { NextResponse } from 'next/server'
import { S3Client, ListObjectsV2Command, HeadBucketCommand } from '@aws-sdk/client-s3'

export async function GET() {
  try {
    // Check if all required environment variables are present
    const requiredVars = {
      CLOUDFLARE_R2_ACCESS_KEY_ID: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
      CLOUDFLARE_R2_SECRET_ACCESS_KEY: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
      CLOUDFLARE_R2_BUCKET_NAME: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      CLOUDFLARE_R2_ENDPOINT: process.env.CLOUDFLARE_R2_ENDPOINT,
    }

    const missingVars = Object.entries(requiredVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key)

    if (missingVars.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Missing required environment variables',
        missingVars,
        presentVars: Object.keys(requiredVars).filter(key => requiredVars[key as keyof typeof requiredVars]),
      }, { status: 400 })
    }

    // Create R2 client
    const r2Client = new S3Client({
      region: 'auto',
      endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
      },
    })

    const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME!

    // Test 1: Check if bucket exists
    console.log('Testing bucket existence...')
    try {
      await r2Client.send(new HeadBucketCommand({ Bucket: bucketName }))
      console.log('✅ Bucket exists and is accessible')
    } catch (bucketError: any) {
      console.error('❌ Bucket test failed:', bucketError.message)
      return NextResponse.json({
        success: false,
        error: 'Bucket test failed',
        details: {
          bucketName,
          errorCode: bucketError.Code || 'Unknown',
          errorMessage: bucketError.message,
          endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
        }
      }, { status: 400 })
    }

    // Test 2: Try to list objects (limited)
    console.log('Testing bucket access...')
    try {
      const listResult = await r2Client.send(new ListObjectsV2Command({
        Bucket: bucketName,
        MaxKeys: 1, // Just test access, don't list everything
      }))
      
      console.log('✅ Bucket access successful')
      
      return NextResponse.json({
        success: true,
        message: 'R2 connection successful',
        bucketName,
        objectCount: listResult.KeyCount || 0,
        hasObjects: (listResult.KeyCount || 0) > 0,
        endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
        timestamp: new Date().toISOString(),
      })

    } catch (accessError: any) {
      console.error('❌ Bucket access failed:', accessError.message)
      return NextResponse.json({
        success: false,
        error: 'Bucket access failed',
        details: {
          bucketName,
          errorCode: accessError.Code || 'Unknown',
          errorMessage: accessError.message,
          endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
        }
      }, { status: 400 })
    }

  } catch (error: any) {
    console.error('❌ R2 test failed:', error)
    return NextResponse.json({
      success: false,
      error: 'R2 test failed',
      details: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
