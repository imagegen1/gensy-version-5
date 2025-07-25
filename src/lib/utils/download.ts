/**
 * Download utilities for Gensy AI Creative Suite
 * Handles image downloads with proper naming and format support
 */

import { Sanitizer } from '../security'

export interface DownloadImageOptions {
  url: string
  filename?: string
  prompt?: string
  model?: string
  timestamp?: string | Date
  format?: 'png' | 'jpeg' | 'jpg'
}

/**
 * Generate a descriptive filename for downloaded images
 */
export function generateImageFilename(options: DownloadImageOptions): string {
  const {
    prompt = 'generated-image',
    model = 'ai-model',
    timestamp,
    format = 'png'
  } = options

  // Clean and truncate prompt for filename using secure sanitization
  const cleanPrompt = prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .substring(0, 50) // Limit length
    .replace(/-+$/, '') // Remove trailing hyphens

  // Clean model name using secure sanitization
  const cleanModel = model
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')

  // Format timestamp
  const date = timestamp ? new Date(timestamp) : new Date()
  const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD format

  // Construct filename and validate it securely
  const parts = [cleanModel, cleanPrompt, dateStr].filter(Boolean)
  const filename = `${parts.join('-')}.${format}`

  try {
    return Sanitizer.sanitizeFilename(filename)
  } catch (error) {
    // Fallback to a safe default filename if sanitization fails
    return `generated-image-${dateStr}.${format}`
  }
}

/**
 * Download an image from a URL with proper browser download handling
 */
export async function downloadImage(options: DownloadImageOptions): Promise<void> {
  const { url, filename } = options

  try {
    console.log('🔽 Starting image download:', { url: url.substring(0, 100) + '...', filename })

    // Validate URL security before proceeding
    const validatedUrl = Sanitizer.validateUrl(url, 'storage')

    // Generate filename if not provided
    const finalFilename = filename || generateImageFilename(options)

    // Validate the final filename
    const safeFinalFilename = Sanitizer.sanitizeFilename(finalFilename)

    // Download the file using the validated URL and filename
    await downloadFromUrl(validatedUrl, safeFinalFilename)

    console.log('✅ Image download completed:', safeFinalFilename)
  } catch (error) {
    console.error('❌ Image download failed:', error)
    throw new Error('Failed to download image. Please try again.')
  }
}

/**
 * Download file from URL using browser's download mechanism
 */
async function downloadFromUrl(url: string, filename: string): Promise<void> {
  try {
    // Fetch the image
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'image/*',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // Get the blob
    const blob = await response.blob()
    
    // Create object URL
    const objectUrl = URL.createObjectURL(blob)

    // Create download link
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = filename
    link.style.display = 'none'

    // Trigger download
    document.body.appendChild(link)
    link.click()

    // Cleanup
    document.body.removeChild(link)
    URL.revokeObjectURL(objectUrl)
  } catch (error) {
    console.error('Download from URL failed:', error)
    throw error
  }
}

/**
 * Get the image format from URL or content type
 */
export function getImageFormat(url: string, contentType?: string): 'png' | 'jpeg' | 'jpg' {
  // Check content type first
  if (contentType) {
    if (contentType.includes('png')) return 'png'
    if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpeg'
  }

  // Check URL extension
  const urlLower = url.toLowerCase()
  if (urlLower.includes('.png')) return 'png'
  if (urlLower.includes('.jpg') || urlLower.includes('.jpeg')) return 'jpeg'

  // Default to PNG for AI-generated images
  return 'png'
}

/**
 * Download image with error handling and user feedback
 */
export async function downloadImageWithFeedback(
  options: DownloadImageOptions,
  onSuccess?: (filename: string) => void,
  onError?: (error: string) => void
): Promise<void> {
  try {
    await downloadImage(options)
    const filename = options.filename || generateImageFilename(options)
    onSuccess?.(filename)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Download failed'
    onError?.(errorMessage)
  }
}

/**
 * Check if download is supported in the current browser
 */
export function isDownloadSupported(): boolean {
  return typeof document !== 'undefined' && 'download' in document.createElement('a')
}

/**
 * Get model display name for filename generation
 */
export function getModelDisplayName(model: string): string {
  const modelMap: Record<string, string> = {
    // Imagen 4.0 models
    'imagen-4.0-generate-preview-06-06': 'imagen-4',
    'imagen-4.0-fast-generate-preview-06-06': 'imagen-4-fast',
    'imagen-4.0-ultra-generate-preview-06-06': 'imagen-4-ultra',
    'Imagen 4': 'imagen-4',
    'Imagen 4 Fast': 'imagen-4-fast',
    'Imagen 4 Ultra': 'imagen-4-ultra',

    // Imagen 3.0 models
    'imagen-3.0-generate-001': 'imagen-3',
    'imagen-3.0-fast-generate-001': 'imagen-3-fast',
    'Imagen 3.0': 'imagen-3',
    'Imagen 3.0 Fast': 'imagen-3-fast',

    // Other models
    'imagegeneration@006': 'imagen-2',
    'Imagen 2.0': 'imagen-2',
    'seedream-3-0-t2i-250415': 'bytedance-seedream-3',
    'Bytedance Seedream 3.0': 'bytedance-seedream-3'
  }

  return modelMap[model] || model.toLowerCase().replace(/[^a-z0-9]/g, '-')
}
