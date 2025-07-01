/**
 * Storage Integration for Gensy AI Creative Suite
 * Central export file for all storage-related functionality
 */

// R2 Client exports
export {
  uploadFile,
  getSignedDownloadUrl,
  deleteFile,
  fileExists,
  getPresignedUploadUrl,
  generateFileKey,
  validateFile,
  r2Client,
} from './r2-client'

export type {
  UploadOptions,
  UploadResult,
} from './r2-client'

// Storage utilities exports
export {
  processAndUploadFile,
  getUserMediaFiles,
  deleteMediaFile,
  updateMediaFileMetadata,
  getUserStorageStats,
  cleanupOrphanedFiles,
} from './utils'

export type {
  ProcessedUploadResult,
} from './utils'

// Storage configuration
export const STORAGE_CONFIG = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  allowedVideoTypes: ['video/mp4', 'video/webm'],
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'],
  presignedUrlExpiry: 3600, // 1 hour
  publicUrlExpiry: 7 * 24 * 3600, // 7 days
} as const

// File type helpers
export const isImageFile = (mimeType: string): boolean => {
  return STORAGE_CONFIG.allowedImageTypes.includes(mimeType)
}

export const isVideoFile = (mimeType: string): boolean => {
  return STORAGE_CONFIG.allowedVideoTypes.includes(mimeType)
}

export const getFileCategory = (mimeType: string): 'image' | 'video' | 'other' => {
  if (isImageFile(mimeType)) return 'image'
  if (isVideoFile(mimeType)) return 'video'
  return 'other'
}

// File size helpers
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const bytesToMB = (bytes: number): number => {
  return bytes / (1024 * 1024)
}

// URL helpers
export const getPublicUrl = (key: string): string => {
  const { env } = require('../env')
  return `${env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`
}

// File extension helpers
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || ''
}

export const removeFileExtension = (filename: string): string => {
  return filename.replace(/\.[^/.]+$/, '')
}
