/**
 * Storage Utilities for Gensy AI Creative Suite
 * Helper functions for file management and processing
 */

import { uploadFile, generateFileKey, validateFile, type UploadResult } from './r2-client'
import { createServiceRoleClient } from '../supabase/server'
import { getCurrentUser } from '../auth'

export interface ProcessedUploadResult extends UploadResult {
  mediaFileId?: string
  generationId?: string
}

/**
 * Process and upload a file with database tracking
 */
export async function processAndUploadFile(
  file: File,
  options: {
    generationId?: string
    isPublic?: boolean
    prefix?: string
    metadata?: Record<string, string>
  } = {}
): Promise<ProcessedUploadResult> {
  try {
    // Get current user
    const userResult = await getCurrentUser()
    if (!userResult.success || !userResult.user) {
      return {
        success: false,
        error: 'User not authenticated',
      }
    }

    const userId = userResult.user.id

    // Validate file
    const validation = validateFile(file)
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      }
    }

    // Generate unique file key
    const fileKey = generateFileKey(
      userId,
      file.name,
      options.prefix || 'uploads'
    )

    // Upload to R2
    const uploadResult = await uploadFile({
      key: fileKey,
      file,
      contentType: file.type,
      metadata: {
        userId,
        originalName: file.name,
        generationId: options.generationId || '',
        ...options.metadata,
      },
      isPublic: options.isPublic,
    })

    if (!uploadResult.success) {
      return uploadResult
    }

    // Save to database
    const supabase = createServiceRoleClient()
    const { data: mediaFile, error: dbError } = await supabase
      .from('media_files')
      .insert({
        user_id: userId,
        generation_id: options.generationId || null,
        filename: file.name,
        file_path: fileKey,
        file_size: file.size,
        mime_type: file.type,
        width: null, // Will be updated after processing
        height: null, // Will be updated after processing
        is_public: options.isPublic || false,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Error saving media file to database:', dbError)
      return {
        success: false,
        error: 'Failed to save file metadata',
      }
    }

    return {
      ...uploadResult,
      mediaFileId: mediaFile.id,
      generationId: options.generationId,
    }
  } catch (error) {
    console.error('Error in processAndUploadFile:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload processing failed',
    }
  }
}

/**
 * Get user's media files with pagination
 */
export async function getUserMediaFiles(
  userId: string,
  options: {
    limit?: number
    offset?: number
    type?: string
    generationId?: string
  } = {}
) {
  try {
    const supabase = createServiceRoleClient()
    
    let query = supabase
      .from('media_files')
      .select(`
        *,
        generations (
          id,
          type,
          prompt,
          status,
          created_at
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    // Apply filters
    if (options.type) {
      query = query.like('mime_type', `${options.type}%`)
    }

    if (options.generationId) {
      query = query.eq('generation_id', options.generationId)
    }

    // Apply pagination
    if (options.limit) {
      const offset = options.offset || 0
      query = query.range(offset, offset + options.limit - 1)
    }

    const { data, error } = await query

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, files: data || [] }
  } catch (error) {
    console.error('Error getting user media files:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get media files',
    }
  }
}

/**
 * Delete a media file and its storage
 */
export async function deleteMediaFile(mediaFileId: string, userId: string) {
  try {
    const supabase = createServiceRoleClient()

    // Get file info
    const { data: mediaFile, error: fetchError } = await supabase
      .from('media_files')
      .select('file_path, user_id')
      .eq('id', mediaFileId)
      .eq('user_id', userId) // Ensure user owns the file
      .single()

    if (fetchError || !mediaFile) {
      return { success: false, error: 'File not found or access denied' }
    }

    // Delete from R2 storage
    const { deleteFile } = await import('./r2-client')
    const deleteResult = await deleteFile(mediaFile.file_path)

    if (!deleteResult.success) {
      console.error('Failed to delete from R2:', deleteResult.error)
      // Continue with database deletion even if R2 deletion fails
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('media_files')
      .delete()
      .eq('id', mediaFileId)
      .eq('user_id', userId)

    if (dbError) {
      return { success: false, error: 'Failed to delete file record' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting media file:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    }
  }
}

/**
 * Update media file metadata (e.g., dimensions after processing)
 */
export async function updateMediaFileMetadata(
  mediaFileId: string,
  metadata: {
    width?: number
    height?: number
    duration?: number
    isPublic?: boolean
  }
) {
  try {
    const supabase = createServiceRoleClient()

    const { data, error } = await supabase
      .from('media_files')
      .update(metadata)
      .eq('id', mediaFileId)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, file: data }
  } catch (error) {
    console.error('Error updating media file metadata:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Update failed',
    }
  }
}

/**
 * Get storage usage statistics for a user
 */
export async function getUserStorageStats(userId: string) {
  try {
    const supabase = createServiceRoleClient()

    const { data, error } = await supabase
      .from('media_files')
      .select('file_size, mime_type')
      .eq('user_id', userId)

    if (error) {
      return { success: false, error: error.message }
    }

    const stats = {
      totalFiles: data.length,
      totalSize: data.reduce((sum, file) => sum + file.file_size, 0),
      imageFiles: data.filter(f => f.mime_type.startsWith('image/')).length,
      videoFiles: data.filter(f => f.mime_type.startsWith('video/')).length,
      imageSize: data
        .filter(f => f.mime_type.startsWith('image/'))
        .reduce((sum, file) => sum + file.file_size, 0),
      videoSize: data
        .filter(f => f.mime_type.startsWith('video/'))
        .reduce((sum, file) => sum + file.file_size, 0),
    }

    return { success: true, stats }
  } catch (error) {
    console.error('Error getting storage stats:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get stats',
    }
  }
}

/**
 * Clean up orphaned files (files without associated generations)
 */
export async function cleanupOrphanedFiles(userId: string, olderThanDays: number = 7) {
  try {
    const supabase = createServiceRoleClient()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    // Find orphaned files
    const { data: orphanedFiles, error } = await supabase
      .from('media_files')
      .select('id, file_path')
      .eq('user_id', userId)
      .is('generation_id', null)
      .lt('created_at', cutoffDate.toISOString())

    if (error) {
      return { success: false, error: error.message }
    }

    if (!orphanedFiles || orphanedFiles.length === 0) {
      return { success: true, deletedCount: 0 }
    }

    // Delete files
    let deletedCount = 0
    for (const file of orphanedFiles) {
      const deleteResult = await deleteMediaFile(file.id, userId)
      if (deleteResult.success) {
        deletedCount++
      }
    }

    return { success: true, deletedCount }
  } catch (error) {
    console.error('Error cleaning up orphaned files:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Cleanup failed',
    }
  }
}
