/**
 * Google Cloud Platform Configuration for Gensy AI Creative Suite
 * Handles Vertex AI and Google Cloud Storage initialization
 */

import { VertexAI } from '@google-cloud/vertexai'
import { GoogleAuth } from 'google-auth-library'
import { env } from './env'

// Initialize Vertex AI
const projectId = env.GOOGLE_CLOUD_PROJECT_ID || 'gensy-development'
const location = env.GOOGLE_CLOUD_LOCATION || 'us-central1'

// Create Vertex AI instance
export const vertexAI = new VertexAI({
  project: projectId,
  location: location,
})

// Initialize different models for text generation (Gemini)
export const textModel = vertexAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
})

// Note: Google Cloud Storage removed - using Cloudflare R2 instead

// Initialize Google Auth
export const auth = new GoogleAuth({
  projectId: projectId,
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
})

// Configuration constants
export const GOOGLE_CLOUD_CONFIG = {
  projectId,
  location,
  models: {
    textGeneration: 'gemini-1.5-flash',
    imageGeneration: 'imagen-3.0-generate-001', // Updated to use Imagen 3
  },
  // Note: Storage configuration removed - using Cloudflare R2 instead
  endpoints: {
    imageGeneration: `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagen-3.0-generate-001:predict`,
  }
} as const

// Helper function to check if Google Cloud is properly configured
export function isGoogleCloudConfigured(): boolean {
  try {
    return !!(
      env.GOOGLE_CLOUD_PROJECT_ID &&
      (env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_APPLICATION_CREDENTIALS)
    )
  } catch {
    return false
  }
}

// Helper function to get authentication status
export async function getGoogleCloudStatus() {
  try {
    if (!isGoogleCloudConfigured()) {
      return {
        configured: false,
        error: 'Google Cloud credentials not configured',
      }
    }

    // Test the connection by getting auth client
    const authClient = await auth.getClient()
    const accessToken = await authClient.getAccessToken()

    return {
      configured: true,
      projectId,
      location,
      models: GOOGLE_CLOUD_CONFIG.models,
      hasValidToken: !!accessToken.token,
    }
  } catch (error) {
    return {
      configured: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
