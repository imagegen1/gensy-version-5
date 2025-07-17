/**
 * Google Cloud Platform Configuration for Gensy AI Creative Suite
 * Handles Vertex AI and Google Cloud Storage initialization
 */

import { VertexAI } from '@google-cloud/vertexai'
import { env } from './env'
import { createGoogleAuth, isGoogleCloudConfigured, getGoogleCloudAuthStatus } from './google-auth'

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

// Initialize Google Auth with enhanced credential handling
export const auth = createGoogleAuth(['https://www.googleapis.com/auth/cloud-platform'])

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

// Re-export authentication functions from google-auth module
export { isGoogleCloudConfigured } from './google-auth'

// Helper function to get authentication status
export async function getGoogleCloudStatus() {
  try {
    const authStatus = await getGoogleCloudAuthStatus()

    if (!authStatus.configured) {
      return {
        configured: false,
        error: authStatus.error,
        method: authStatus.method,
      }
    }

    return {
      configured: true,
      method: authStatus.method,
      projectId: authStatus.projectId,
      serviceAccountEmail: authStatus.serviceAccountEmail,
      location,
      models: GOOGLE_CLOUD_CONFIG.models,
    }
  } catch (error) {
    return {
      configured: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
