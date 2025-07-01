/**
 * Batch Processing Service for Gensy AI Creative Suite
 * Handles batch upscaling and processing of multiple images
 */

import { ImageUpscalingService, UpscalingOptions, UpscalingResult } from './image-upscaling'
// import JSZip from 'jszip' // Temporarily disabled

export interface BatchProcessingOptions extends UpscalingOptions {
  scaleFactor: number
  onProgress?: (completed: number, total: number, currentFile?: string) => void
  onFileComplete?: (result: BatchProcessingResult) => void
  maxConcurrent?: number
}

export interface BatchProcessingResult {
  index: number
  filename: string
  originalFile: File
  result?: UpscalingResult
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error?: string
  startTime?: number
  endTime?: number
}

export interface BatchProcessingSummary {
  results: BatchProcessingResult[]
  summary: {
    total: number
    completed: number
    failed: number
    totalProcessingTime: number
    averageProcessingTime: number
  }
  zipBuffer?: Buffer
}

export class BatchProcessingService {
  /**
   * Process multiple images in batch
   */
  static async processBatch(
    images: File[],
    options: BatchProcessingOptions
  ): Promise<BatchProcessingSummary> {
    const results: BatchProcessingResult[] = images.map((file, index) => ({
      index,
      filename: file.name,
      originalFile: file,
      status: 'pending' as const
    }))

    const maxConcurrent = options.maxConcurrent || 3
    const batches = this.createBatches(images, maxConcurrent)
    
    let completed = 0
    const startTime = Date.now()

    // Process batches sequentially, but files within each batch concurrently
    for (const batch of batches) {
      const batchPromises = batch.map(async (file, batchIndex) => {
        const resultIndex = results.findIndex(r => r.originalFile === file)
        const result = results[resultIndex]
        
        try {
          result.status = 'processing'
          result.startTime = Date.now()
          
          options.onProgress?.(completed, images.length, file.name)

          // Convert file to buffer
          const imageBuffer = Buffer.from(await file.arrayBuffer())
          
          // Process the image
          const upscalingResult = await ImageUpscalingService.upscaleImage(
            imageBuffer,
            options.scaleFactor,
            options
          )

          result.endTime = Date.now()
          result.result = upscalingResult
          result.status = upscalingResult.success ? 'completed' : 'failed'
          
          if (!upscalingResult.success) {
            result.error = upscalingResult.error
          }

          completed++
          options.onProgress?.(completed, images.length, file.name)
          options.onFileComplete?.(result)

        } catch (error) {
          result.endTime = Date.now()
          result.status = 'failed'
          result.error = error instanceof Error ? error.message : 'Unknown error'
          
          completed++
          options.onProgress?.(completed, images.length, file.name)
          options.onFileComplete?.(result)
        }
      })

      // Wait for current batch to complete before starting next batch
      await Promise.all(batchPromises)
    }

    const endTime = Date.now()
    const totalProcessingTime = endTime - startTime

    // Calculate summary
    const completedResults = results.filter(r => r.status === 'completed')
    const failedResults = results.filter(r => r.status === 'failed')
    
    const summary = {
      total: images.length,
      completed: completedResults.length,
      failed: failedResults.length,
      totalProcessingTime,
      averageProcessingTime: completedResults.length > 0 
        ? totalProcessingTime / completedResults.length 
        : 0
    }

    return {
      results,
      summary
    }
  }

  /**
   * Create ZIP file with all processed images
   */
  static async createZipDownload(results: BatchProcessingResult[]): Promise<Buffer> {
    // Temporarily disabled - JSZip not available
    throw new Error('ZIP download functionality temporarily disabled')

    // const zip = new JSZip()
    //
    // const successfulResults = results.filter(
    //   r => r.status === 'completed' && r.result?.success && r.result.imageBuffer
    // )
    //
    // for (const result of successfulResults) {
    //   if (result.result?.imageBuffer) {
    //     // Generate filename with scale factor
    //     const originalName = result.filename
    //     const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '')
    //     const ext = originalName.split('.').pop() || 'png'
    //     const scaleFactor = result.result.metadata?.scaleFactor || 2
    //     const newFilename = `${nameWithoutExt}_${scaleFactor}x.${ext}`
    //
    //     zip.file(newFilename, result.result.imageBuffer)
    //   }
    // }
    //
    // // Add summary file
    // const summaryText = this.generateSummaryText(results)
    // zip.file('processing_summary.txt', summaryText)
    //
    // return await zip.generateAsync({ type: 'nodebuffer' })
  }

  /**
   * Generate processing summary text
   */
  private static generateSummaryText(results: BatchProcessingResult[]): string {
    const completed = results.filter(r => r.status === 'completed').length
    const failed = results.filter(r => r.status === 'failed').length
    const total = results.length
    
    let summary = `Batch Processing Summary\n`
    summary += `========================\n\n`
    summary += `Total files: ${total}\n`
    summary += `Successfully processed: ${completed}\n`
    summary += `Failed: ${failed}\n`
    summary += `Success rate: ${((completed / total) * 100).toFixed(1)}%\n\n`
    
    summary += `Processing Details:\n`
    summary += `------------------\n`
    
    results.forEach((result, index) => {
      summary += `${index + 1}. ${result.filename}\n`
      summary += `   Status: ${result.status}\n`
      
      if (result.result?.metadata) {
        const metadata = result.result.metadata
        summary += `   Scale Factor: ${metadata.scaleFactor}x\n`
        summary += `   Processing Time: ${metadata.processingTime}ms\n`
        
        if (metadata.originalSize && metadata.upscaledSize) {
          summary += `   Original: ${metadata.originalSize.width}x${metadata.originalSize.height}\n`
          summary += `   Upscaled: ${metadata.upscaledSize.width}x${metadata.upscaledSize.height}\n`
        }
      }
      
      if (result.error) {
        summary += `   Error: ${result.error}\n`
      }
      
      summary += `\n`
    })
    
    return summary
  }

  /**
   * Create batches for concurrent processing
   */
  private static createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = []
    
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize))
    }
    
    return batches
  }

  /**
   * Estimate total processing time for batch
   */
  static estimateBatchProcessingTime(
    images: File[],
    scaleFactor: number,
    maxConcurrent: number = 3
  ): number {
    const totalSize = images.reduce((sum, img) => sum + img.size, 0)
    const averageSize = totalSize / images.length
    
    // Estimate time per image
    const timePerImage = ImageUpscalingService.estimateProcessingTime(averageSize, scaleFactor)
    
    // Account for concurrent processing
    const batches = Math.ceil(images.length / maxConcurrent)
    const totalTime = batches * timePerImage
    
    return totalTime
  }

  /**
   * Validate batch processing request
   */
  static validateBatchRequest(images: File[]): {
    isValid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    // Check number of files
    if (images.length === 0) {
      errors.push('No images provided')
    } else if (images.length > 50) {
      errors.push('Maximum 50 images allowed per batch')
    } else if (images.length > 20) {
      warnings.push('Large batches may take significant time to process')
    }

    // Check total file size
    const totalSize = images.reduce((sum, img) => sum + img.size, 0)
    const maxTotalSize = 500 * 1024 * 1024 // 500MB
    
    if (totalSize > maxTotalSize) {
      errors.push(`Total file size too large (${Math.round(totalSize / 1024 / 1024)}MB). Maximum is 500MB.`)
    }

    // Check individual file sizes and types
    images.forEach((file, index) => {
      if (file.size > 50 * 1024 * 1024) {
        errors.push(`File ${index + 1} (${file.name}) is too large (max 50MB)`)
      }
      
      if (!file.type.startsWith('image/')) {
        errors.push(`File ${index + 1} (${file.name}) is not an image`)
      }
    })

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Calculate credit cost for batch processing
   */
  static calculateBatchCreditCost(
    imageCount: number,
    enhancement: string
  ): number {
    const baseCreditsPerImage = enhancement === 'ai-enhanced' ? 3 : 2
    return imageCount * baseCreditsPerImage
  }
}
