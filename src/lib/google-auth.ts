/**
 * Google Cloud Authentication Helper
 * Handles both file-based and Base64 encoded service account credentials
 */

import { GoogleAuth } from 'google-auth-library'
import { env } from './env'

// Cache for parsed credentials
let cachedCredentials: any = null

/**
 * Get Google Cloud credentials from either file path or Base64 environment variable
 */
export function getGoogleCredentials(): any {
  if (cachedCredentials) {
    return cachedCredentials
  }

  try {
    // Option 1: Use Base64 encoded credentials (recommended for production)
    if (env.GOOGLE_CREDENTIALS_BASE64) {
      console.log('🔐 GOOGLE AUTH: Using Base64 encoded credentials')
      
      try {
        const credentialsJsonString = Buffer.from(
          env.GOOGLE_CREDENTIALS_BASE64,
          'base64'
        ).toString('utf-8')

        cachedCredentials = JSON.parse(credentialsJsonString)
        return cachedCredentials
      } catch (parseError) {
        console.error('❌ GOOGLE AUTH: Failed to parse Base64 credentials:', parseError)
        throw new Error(`Invalid Base64 credentials format: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`)
      }
    }

    // Option 2: Use file path (for local development)
    if (env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.log('🔐 GOOGLE AUTH: Using file path credentials:', env.GOOGLE_APPLICATION_CREDENTIALS)
      
      // Let Google Auth library handle file loading
      return null // This will make GoogleAuth use the file path from environment
    }

    throw new Error('No Google Cloud credentials configured')

  } catch (error) {
    console.error('❌ GOOGLE AUTH: Failed to load credentials:', error)
    throw new Error(`Failed to load Google Cloud credentials: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Create Google Auth instance with proper credentials
 */
export function createGoogleAuth(scopes: string[] = ['https://www.googleapis.com/auth/cloud-platform']): GoogleAuth {
  const credentials = getGoogleCredentials()

  const authConfig: any = {
    projectId: env.GOOGLE_CLOUD_PROJECT_ID,
    scopes,
  }

  // If we have parsed credentials (Base64), use them directly
  if (credentials) {
    authConfig.credentials = credentials
  } else {
    // Otherwise, let GoogleAuth use the file path from environment
    authConfig.keyFilename = env.GOOGLE_APPLICATION_CREDENTIALS
  }

  return new GoogleAuth(authConfig)
}

/**
 * Get service account email from credentials
 */
export function getServiceAccountEmail(): string {
  try {
    const credentials = getGoogleCredentials()
    
    if (credentials && credentials.client_email) {
      return credentials.client_email
    }

    // If using file path, we need to read it
    if (env.GOOGLE_APPLICATION_CREDENTIALS) {
      const fs = require('fs')
      const credentialsFile = JSON.parse(fs.readFileSync(env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'))
      return credentialsFile.client_email
    }

    throw new Error('No service account email found')
  } catch (error) {
    console.error('❌ GOOGLE AUTH: Failed to get service account email:', error)
    throw error
  }
}

/**
 * Validate Google Cloud credentials
 */
export async function validateGoogleCredentials(): Promise<{
  valid: boolean
  projectId?: string
  serviceAccountEmail?: string
  error?: string
}> {
  try {
    const auth = createGoogleAuth()
    const authClient = await auth.getClient()
    const accessToken = await authClient.getAccessToken()

    if (!accessToken.token) {
      throw new Error('Failed to obtain access token')
    }

    const serviceAccountEmail = getServiceAccountEmail()

    return {
      valid: true,
      projectId: env.GOOGLE_CLOUD_PROJECT_ID,
      serviceAccountEmail,
    }

  } catch (error) {
    console.error('❌ GOOGLE AUTH: Credential validation failed:', error)
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown validation error',
    }
  }
}

/**
 * Check if Google Cloud is properly configured
 */
export function isGoogleCloudConfigured(): boolean {
  try {
    // Check if Google Cloud is disabled during build
    if (process.env.NEXT_BUILD_DISABLE_GOOGLE_CLOUD === 'true') {
      return false
    }

    return !!(
      env.GOOGLE_CLOUD_PROJECT_ID &&
      (env.GOOGLE_CREDENTIALS_BASE64 || env.GOOGLE_APPLICATION_CREDENTIALS)
    )
  } catch {
    return false
  }
}

/**
 * Get Google Cloud configuration status
 */
export async function getGoogleCloudAuthStatus() {
  try {
    if (!isGoogleCloudConfigured()) {
      return {
        configured: false,
        error: 'Google Cloud credentials not configured',
        method: 'none',
      }
    }

    const method = env.GOOGLE_CREDENTIALS_BASE64 ? 'base64' : 'file'
    const validation = await validateGoogleCredentials()

    return {
      configured: validation.valid,
      method,
      projectId: validation.projectId,
      serviceAccountEmail: validation.serviceAccountEmail,
      error: validation.error,
    }

  } catch (error) {
    return {
      configured: false,
      method: 'unknown',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
