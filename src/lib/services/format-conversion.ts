/**
 * Image Format Conversion Service for Gensy AI Creative Suite
 * Handles image format conversion and optimization using Sharp
 */

import sharp from 'sharp'

export interface ConversionOptions {
  quality?: number
  compression?: number
  lossless?: boolean
  progressive?: boolean
  optimizeForWeb?: boolean
  stripMetadata?: boolean
}

export interface ConversionResult {
  success: boolean
  imageBuffer?: Buffer
  metadata?: {
    originalFormat: string
    targetFormat: string
    originalSize: number
    convertedSize: number
    compressionRatio: number
    processingTime: number
    dimensions: { width: number; height: number }
  }
  error?: string
}

export interface OptimizationOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  stripMetadata?: boolean
  progressive?: boolean
}

export class FormatConversionService {
  /**
   * Convert image format
   */
  static async convertFormat(
    imageBuffer: Buffer,
    targetFormat: 'jpeg' | 'png' | 'webp' | 'avif',
    options: ConversionOptions = {}
  ): Promise<ConversionResult> {
    const startTime = Date.now()

    try {
      // Get original image metadata
      const originalImage = sharp(imageBuffer)
      const originalMetadata = await originalImage.metadata()
      
      if (!originalMetadata.width || !originalMetadata.height) {
        throw new Error('Unable to read image dimensions')
      }

      const originalFormat = originalMetadata.format || 'unknown'
      const originalSize = imageBuffer.length

      // Create processing pipeline
      let pipeline = sharp(imageBuffer)

      // Strip metadata if requested
      if (options.stripMetadata) {
        pipeline = pipeline.withMetadata({})
      }

      // Apply format-specific settings
      switch (targetFormat) {
        case 'jpeg':
          pipeline = pipeline.jpeg({
            quality: options.quality || 85,
            progressive: options.progressive !== false,
            mozjpeg: true // Use mozjpeg encoder for better compression
          })
          break

        case 'png':
          pipeline = pipeline.png({
            compressionLevel: options.compression || 6,
            progressive: options.progressive !== false,
            palette: options.optimizeForWeb
          })
          break

        case 'webp':
          pipeline = pipeline.webp({
            quality: options.quality || 85,
            lossless: options.lossless || false,
            nearLossless: !options.lossless,
            smartSubsample: true
          })
          break

        case 'avif':
          pipeline = pipeline.avif({
            quality: options.quality || 85,
            lossless: options.lossless || false,
            speed: 4 // Balance between speed and compression
          })
          break

        default:
          throw new Error(`Unsupported target format: ${targetFormat}`)
      }

      // Convert the image
      const convertedBuffer = await pipeline.toBuffer()
      const processingTime = Date.now() - startTime
      const convertedSize = convertedBuffer.length
      const compressionRatio = originalSize / convertedSize

      return {
        success: true,
        imageBuffer: convertedBuffer,
        metadata: {
          originalFormat,
          targetFormat,
          originalSize,
          convertedSize,
          compressionRatio,
          processingTime,
          dimensions: {
            width: originalMetadata.width,
            height: originalMetadata.height
          }
        }
      }

    } catch (error) {
      console.error('Format conversion error:', error)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown conversion error',
        metadata: {
          originalFormat: 'unknown',
          targetFormat,
          originalSize: imageBuffer.length,
          convertedSize: 0,
          compressionRatio: 0,
          processingTime: Date.now() - startTime,
          dimensions: { width: 0, height: 0 }
        }
      }
    }
  }

  /**
   * Optimize image for web
   */
  static async optimizeImage(
    imageBuffer: Buffer,
    options: OptimizationOptions = {}
  ): Promise<ConversionResult> {
    const startTime = Date.now()

    try {
      const originalImage = sharp(imageBuffer)
      const originalMetadata = await originalImage.metadata()
      
      if (!originalMetadata.width || !originalMetadata.height) {
        throw new Error('Unable to read image dimensions')
      }

      const originalSize = imageBuffer.length
      let pipeline = sharp(imageBuffer)

      // Resize if dimensions are specified
      if (options.maxWidth || options.maxHeight) {
        pipeline = pipeline.resize(options.maxWidth, options.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
      }

      // Strip metadata for smaller file size
      if (options.stripMetadata !== false) {
        pipeline = pipeline.withMetadata({})
      }

      // Choose optimal format based on image characteristics
      const hasAlpha = originalMetadata.channels === 4
      const isPhoto = originalMetadata.density && originalMetadata.density > 72

      let optimizedBuffer: Buffer
      let targetFormat: string

      if (hasAlpha) {
        // Use PNG for images with transparency
        targetFormat = 'png'
        optimizedBuffer = await pipeline
          .png({
            compressionLevel: 9,
            progressive: options.progressive !== false
          })
          .toBuffer()
      } else if (isPhoto) {
        // Use JPEG for photographs
        targetFormat = 'jpeg'
        optimizedBuffer = await pipeline
          .jpeg({
            quality: options.quality || 85,
            progressive: options.progressive !== false,
            mozjpeg: true
          })
          .toBuffer()
      } else {
        // Use WebP for other images (best compression)
        targetFormat = 'webp'
        optimizedBuffer = await pipeline
          .webp({
            quality: options.quality || 85,
            lossless: false
          })
          .toBuffer()
      }

      const processingTime = Date.now() - startTime
      const optimizedSize = optimizedBuffer.length
      const compressionRatio = originalSize / optimizedSize

      // Get final dimensions
      const finalMetadata = await sharp(optimizedBuffer).metadata()

      return {
        success: true,
        imageBuffer: optimizedBuffer,
        metadata: {
          originalFormat: originalMetadata.format || 'unknown',
          targetFormat,
          originalSize,
          convertedSize: optimizedSize,
          compressionRatio,
          processingTime,
          dimensions: {
            width: finalMetadata.width || 0,
            height: finalMetadata.height || 0
          }
        }
      }

    } catch (error) {
      console.error('Image optimization error:', error)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown optimization error',
        metadata: {
          originalFormat: 'unknown',
          targetFormat: 'unknown',
          originalSize: imageBuffer.length,
          convertedSize: 0,
          compressionRatio: 0,
          processingTime: Date.now() - startTime,
          dimensions: { width: 0, height: 0 }
        }
      }
    }
  }

  /**
   * Get supported formats
   */
  static getSupportedFormats(): {
    input: string[]
    output: string[]
  } {
    return {
      input: ['jpeg', 'jpg', 'png', 'webp', 'avif', 'tiff', 'gif', 'svg'],
      output: ['jpeg', 'png', 'webp', 'avif']
    }
  }

  /**
   * Get format recommendations
   */
  static getFormatRecommendations(
    originalFormat: string,
    hasTransparency: boolean,
    isPhoto: boolean
  ): {
    recommended: string
    alternatives: string[]
    reasoning: string
  } {
    if (hasTransparency) {
      return {
        recommended: 'png',
        alternatives: ['webp'],
        reasoning: 'PNG preserves transparency. WebP also supports transparency with better compression.'
      }
    }

    if (isPhoto) {
      return {
        recommended: 'jpeg',
        alternatives: ['webp', 'avif'],
        reasoning: 'JPEG is ideal for photographs. WebP and AVIF offer better compression for modern browsers.'
      }
    }

    return {
      recommended: 'webp',
      alternatives: ['png', 'jpeg'],
      reasoning: 'WebP offers excellent compression for graphics and illustrations.'
    }
  }

  /**
   * Estimate file size after conversion
   */
  static estimateConvertedSize(
    originalSize: number,
    originalFormat: string,
    targetFormat: string,
    quality: number = 85
  ): number {
    // Rough estimation based on typical compression ratios
    const compressionRatios: Record<string, Record<string, number>> = {
      'png': {
        'jpeg': 0.3,
        'webp': 0.25,
        'avif': 0.2,
        'png': 1.0
      },
      'jpeg': {
        'png': 1.5,
        'webp': 0.8,
        'avif': 0.6,
        'jpeg': 1.0
      },
      'webp': {
        'jpeg': 1.2,
        'png': 1.8,
        'avif': 0.8,
        'webp': 1.0
      }
    }

    const qualityMultiplier = quality / 85 // Adjust for quality setting
    const baseRatio = compressionRatios[originalFormat]?.[targetFormat] || 1.0
    
    return Math.round(originalSize * baseRatio * qualityMultiplier)
  }

  /**
   * Validate conversion request
   */
  static validateConversionRequest(
    imageBuffer: Buffer,
    targetFormat: string
  ): {
    isValid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []
    const supportedFormats = this.getSupportedFormats()

    // Check if target format is supported
    if (!supportedFormats.output.includes(targetFormat)) {
      errors.push(`Unsupported target format: ${targetFormat}`)
    }

    // Check file size
    if (imageBuffer.length > 100 * 1024 * 1024) {
      errors.push('Image file too large (max 100MB)')
    }

    // Check if buffer is valid
    if (imageBuffer.length === 0) {
      errors.push('Invalid image buffer')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }
}
