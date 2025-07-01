/**
 * Image Upscaling Service for Gensy AI Creative Suite
 * Handles AI image upscaling and enhancement using Google Vertex AI and Sharp
 */

import sharp from 'sharp'
import { vertexAI, textModel, isGoogleCloudConfigured, auth, GOOGLE_CLOUD_CONFIG } from '@/lib/google-cloud'

export interface UpscalingOptions {
  mode?: 'upscale' | 'enhance' | 'denoise' | 'sharpen'
  outputFormat?: 'png' | 'jpeg' | 'webp'
  quality?: number
  enhancement?: 'none' | 'denoise' | 'sharpen' | 'colorize'
}

export interface UpscalingResult {
  success: boolean
  imageBuffer?: Buffer
  metadata?: {
    originalSize: { width: number; height: number; fileSize: number }
    upscaledSize: { width: number; height: number; fileSize: number }
    scaleFactor: number
    processingTime: number
    enhancement?: string
  }
  error?: string
}

export class ImageUpscalingService {
  /**
   * Upscale an image using Google Vertex AI
   */
  static async upscaleWithVertexAI(
    imageBuffer: Buffer,
    scaleFactor: number = 2,
    options: UpscalingOptions = {}
  ): Promise<UpscalingResult> {
    const startTime = Date.now()

    try {
      if (!isGoogleCloudConfigured()) {
        console.log('Google Cloud not configured, falling back to Sharp upscaling')
        return await this.upscaleImage(imageBuffer, scaleFactor, options)
      }

      // Validate inputs
      if (!imageBuffer || imageBuffer.length === 0) {
        throw new Error('Invalid image buffer')
      }

      if (scaleFactor < 1 || scaleFactor > 8) {
        throw new Error('Scale factor must be between 1 and 8')
      }

      // Get original image metadata
      const originalImage = sharp(imageBuffer)
      const originalMetadata = await originalImage.metadata()

      if (!originalMetadata.width || !originalMetadata.height) {
        throw new Error('Unable to read image dimensions')
      }

      const originalSize = {
        width: originalMetadata.width,
        height: originalMetadata.height,
        fileSize: imageBuffer.length
      }

      // Convert image to base64 for Vertex AI
      const base64Image = imageBuffer.toString('base64')

      // Create upscaling prompt based on enhancement type
      let enhancementPrompt = ''
      switch (options.enhancement) {
        case 'denoise':
          enhancementPrompt = 'Remove noise and grain while preserving details. '
          break
        case 'sharpen':
          enhancementPrompt = 'Enhance sharpness and clarity of edges and details. '
          break
        case 'colorize':
          enhancementPrompt = 'Enhance colors, saturation, and contrast for more vibrant appearance. '
          break
        case 'ai-enhanced':
          enhancementPrompt = 'Apply advanced AI enhancement to improve overall image quality, sharpness, and clarity. '
          break
        default:
          enhancementPrompt = ''
      }

      const prompt = `${enhancementPrompt}Upscale this image by ${scaleFactor}x while maintaining high quality and preserving all details. The output should be crisp, clear, and artifact-free.`

      // Use Vertex AI Imagen for upscaling
      const request = {
        contents: [{
          role: 'user',
          parts: [
            { text: prompt },
            {
              inline_data: {
                data: base64Image,
                mimeType: originalMetadata.format === 'jpeg' ? 'image/jpeg' : 'image/png'
              }
            }
          ]
        }]
      }

      // Since Vertex AI Imagen doesn't directly support upscaling, we'll use the text model
      // to analyze the image and then apply Sharp-based upscaling with AI recommendations
      const response = await textModel.generateContent(request)
      const analysis = response.response.text()

      // Apply AI-guided upscaling using Sharp
      const upscaledBuffer = await this.applyAIGuidedUpscaling(
        imageBuffer,
        scaleFactor,
        analysis,
        options
      )

      const processingTime = Date.now() - startTime
      const newWidth = Math.round(originalMetadata.width * scaleFactor)
      const newHeight = Math.round(originalMetadata.height * scaleFactor)

      const upscaledSize = {
        width: newWidth,
        height: newHeight,
        fileSize: upscaledBuffer.length
      }

      return {
        success: true,
        imageBuffer: upscaledBuffer,
        metadata: {
          originalSize,
          upscaledSize,
          scaleFactor,
          processingTime,
          enhancement: options.enhancement,
          aiAnalysis: analysis.substring(0, 200) // Store first 200 chars of analysis
        }
      }

    } catch (error) {
      console.error('Vertex AI upscaling error:', error)

      // Fallback to Sharp upscaling
      console.log('Falling back to Sharp upscaling due to error')
      return await this.upscaleImage(imageBuffer, scaleFactor, options)
    }
  }

  /**
   * Apply AI-guided upscaling using Sharp with Vertex AI recommendations
   */
  private static async applyAIGuidedUpscaling(
    imageBuffer: Buffer,
    scaleFactor: number,
    aiAnalysis: string,
    options: UpscalingOptions
  ): Promise<Buffer> {
    const originalImage = sharp(imageBuffer)
    const originalMetadata = await originalImage.metadata()

    if (!originalMetadata.width || !originalMetadata.height) {
      throw new Error('Unable to read image dimensions')
    }

    // Calculate new dimensions
    const newWidth = Math.round(originalMetadata.width * scaleFactor)
    const newHeight = Math.round(originalMetadata.height * scaleFactor)

    // Start with high-quality upscaling
    let pipeline = sharp(imageBuffer)
      .resize(newWidth, newHeight, {
        kernel: sharp.kernel.lanczos3, // High-quality resampling
        withoutEnlargement: false
      })

    // Parse AI analysis for enhancement recommendations
    const lowerAnalysis = aiAnalysis.toLowerCase()

    // Apply AI-recommended enhancements
    if (lowerAnalysis.includes('sharp') || lowerAnalysis.includes('edge') || options.enhancement === 'sharpen') {
      pipeline = pipeline.sharpen(2, 1, 0.5)
    }

    if (lowerAnalysis.includes('noise') || lowerAnalysis.includes('grain') || options.enhancement === 'denoise') {
      pipeline = pipeline.blur(0.3).sharpen(1, 1, 0.5)
    }

    if (lowerAnalysis.includes('contrast') || lowerAnalysis.includes('dark')) {
      pipeline = pipeline.linear(1.1, -(128 * 1.1) + 128)
    }

    if (lowerAnalysis.includes('color') || lowerAnalysis.includes('vibrant') || options.enhancement === 'colorize') {
      pipeline = pipeline.modulate({ saturation: 1.2, brightness: 1.05 })
    }

    // Apply additional AI-enhanced processing
    if (options.enhancement === 'ai-enhanced') {
      pipeline = pipeline
        .sharpen(1.5, 1, 0.5)
        .modulate({ saturation: 1.1, brightness: 1.02 })
        .linear(1.05, -(128 * 1.05) + 128)
    }

    // Set output format and quality
    const outputFormat = options.outputFormat || 'png'
    const quality = options.quality || 90

    switch (outputFormat) {
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality, progressive: true })
        break
      case 'webp':
        pipeline = pipeline.webp({ quality, lossless: false })
        break
      case 'png':
      default:
        pipeline = pipeline.png({ compressionLevel: 6, progressive: true })
        break
    }

    return await pipeline.toBuffer()
  }

  /**
   * Upscale an image using Sharp with AI enhancement (fallback method)
   */
  static async upscaleImage(
    imageBuffer: Buffer,
    scaleFactor: number = 2,
    options: UpscalingOptions = {}
  ): Promise<UpscalingResult> {
    const startTime = Date.now()

    try {
      // Validate inputs
      if (!imageBuffer || imageBuffer.length === 0) {
        throw new Error('Invalid image buffer')
      }

      if (scaleFactor < 1 || scaleFactor > 8) {
        throw new Error('Scale factor must be between 1 and 8')
      }

      // Get original image metadata
      const originalImage = sharp(imageBuffer)
      const originalMetadata = await originalImage.metadata()
      
      if (!originalMetadata.width || !originalMetadata.height) {
        throw new Error('Unable to read image dimensions')
      }

      const originalSize = {
        width: originalMetadata.width,
        height: originalMetadata.height,
        fileSize: imageBuffer.length
      }

      // Calculate new dimensions
      const newWidth = Math.round(originalMetadata.width * scaleFactor)
      const newHeight = Math.round(originalMetadata.height * scaleFactor)

      // Perform upscaling with Sharp
      let pipeline = sharp(imageBuffer)
        .resize(newWidth, newHeight, {
          kernel: sharp.kernel.lanczos3, // High-quality resampling
          withoutEnlargement: false
        })

      // Apply enhancements based on options
      if (options.enhancement) {
        pipeline = await this.applyEnhancement(pipeline, options.enhancement)
      }

      // Set output format and quality
      const outputFormat = options.outputFormat || 'png'
      const quality = options.quality || 90

      switch (outputFormat) {
        case 'jpeg':
          pipeline = pipeline.jpeg({ quality, progressive: true })
          break
        case 'webp':
          pipeline = pipeline.webp({ quality, lossless: false })
          break
        case 'png':
        default:
          pipeline = pipeline.png({ compressionLevel: 6, progressive: true })
          break
      }

      // Generate the upscaled image
      const upscaledBuffer = await pipeline.toBuffer()
      const processingTime = Date.now() - startTime

      const upscaledSize = {
        width: newWidth,
        height: newHeight,
        fileSize: upscaledBuffer.length
      }

      return {
        success: true,
        imageBuffer: upscaledBuffer,
        metadata: {
          originalSize,
          upscaledSize,
          scaleFactor,
          processingTime,
          enhancement: options.enhancement
        }
      }

    } catch (error) {
      console.error('Image upscaling error:', error)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upscaling error',
        metadata: {
          originalSize: { width: 0, height: 0, fileSize: imageBuffer.length },
          upscaledSize: { width: 0, height: 0, fileSize: 0 },
          scaleFactor,
          processingTime: Date.now() - startTime
        }
      }
    }
  }

  /**
   * Apply image enhancement using Sharp filters
   */
  private static async applyEnhancement(
    pipeline: sharp.Sharp,
    enhancement: string
  ): Promise<sharp.Sharp> {
    switch (enhancement) {
      case 'denoise':
        // Apply noise reduction
        return pipeline.blur(0.3).sharpen(1, 1, 0.5)
        
      case 'sharpen':
        // Apply sharpening
        return pipeline.sharpen(2, 1, 0.5)
        
      case 'colorize':
        // Enhance colors and contrast
        return pipeline
          .modulate({ saturation: 1.2, brightness: 1.05 })
          .linear(1.1, -(128 * 1.1) + 128) // Increase contrast
          
      default:
        return pipeline
    }
  }

  /**
   * Enhance image using AI-powered description and regeneration
   */
  static async enhanceWithAI(
    imageBuffer: Buffer,
    enhancementPrompt?: string
  ): Promise<UpscalingResult> {
    const startTime = Date.now()

    try {
      if (!isGoogleCloudConfigured()) {
        throw new Error('Google Cloud Vertex AI is not configured')
      }

      // Convert image to base64 for AI analysis
      const base64Image = imageBuffer.toString('base64')
      
      // Create enhancement prompt
      const prompt = enhancementPrompt || `
        Analyze this image and suggest improvements for upscaling:
        - Identify areas that need sharpening
        - Detect noise that should be reduced
        - Suggest color enhancements
        - Recommend optimal processing parameters
        
        Provide specific technical recommendations for image enhancement.
      `

      // Use Vertex AI to analyze the image
      const request = {
        contents: [{
          role: 'user',
          parts: [
            { text: prompt },
            { 
              inline_data: { 
                data: base64Image, 
                mimeType: 'image/jpeg' 
              } 
            }
          ]
        }]
      }

      const response = await textModel.generateContent(request)
      const analysis = response.response.text()

      // Apply AI-recommended enhancements
      const enhancedBuffer = await this.applyAIRecommendations(imageBuffer, analysis)
      
      const processingTime = Date.now() - startTime

      return {
        success: true,
        imageBuffer: enhancedBuffer,
        metadata: {
          originalSize: { width: 0, height: 0, fileSize: imageBuffer.length },
          upscaledSize: { width: 0, height: 0, fileSize: enhancedBuffer.length },
          scaleFactor: 1,
          processingTime,
          enhancement: 'ai-enhanced'
        }
      }

    } catch (error) {
      console.error('AI enhancement error:', error)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'AI enhancement failed',
        metadata: {
          originalSize: { width: 0, height: 0, fileSize: imageBuffer.length },
          upscaledSize: { width: 0, height: 0, fileSize: 0 },
          scaleFactor: 1,
          processingTime: Date.now() - startTime
        }
      }
    }
  }

  /**
   * Apply AI-recommended enhancements
   */
  private static async applyAIRecommendations(
    imageBuffer: Buffer,
    analysis: string
  ): Promise<Buffer> {
    let pipeline = sharp(imageBuffer)

    // Parse AI analysis and apply recommendations
    const lowerAnalysis = analysis.toLowerCase()

    if (lowerAnalysis.includes('sharpen') || lowerAnalysis.includes('blur')) {
      pipeline = pipeline.sharpen(1.5, 1, 0.5)
    }

    if (lowerAnalysis.includes('noise') || lowerAnalysis.includes('grain')) {
      pipeline = pipeline.blur(0.2)
    }

    if (lowerAnalysis.includes('contrast') || lowerAnalysis.includes('dark')) {
      pipeline = pipeline.linear(1.1, -(128 * 1.1) + 128)
    }

    if (lowerAnalysis.includes('color') || lowerAnalysis.includes('saturation')) {
      pipeline = pipeline.modulate({ saturation: 1.15, brightness: 1.02 })
    }

    return await pipeline.png({ compressionLevel: 6 }).toBuffer()
  }

  /**
   * Validate image file
   */
  static async validateImage(imageBuffer: Buffer): Promise<{
    isValid: boolean
    metadata?: sharp.Metadata
    error?: string
  }> {
    try {
      const image = sharp(imageBuffer)
      const metadata = await image.metadata()

      // Check if it's a valid image
      if (!metadata.width || !metadata.height) {
        return {
          isValid: false,
          error: 'Invalid image format'
        }
      }

      // Check file size (max 50MB)
      if (imageBuffer.length > 50 * 1024 * 1024) {
        return {
          isValid: false,
          error: 'Image file too large (max 50MB)'
        }
      }

      // Check dimensions (max 8000x8000)
      if (metadata.width > 8000 || metadata.height > 8000) {
        return {
          isValid: false,
          error: 'Image dimensions too large (max 8000x8000)'
        }
      }

      return {
        isValid: true,
        metadata
      }

    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Image validation failed'
      }
    }
  }

  /**
   * Get supported scale factors
   */
  static getSupportedScaleFactors(): number[] {
    return [1.5, 2, 3, 4, 6, 8]
  }

  /**
   * Get supported enhancement types
   */
  static getSupportedEnhancements(): string[] {
    return ['none', 'denoise', 'sharpen', 'colorize', 'ai-enhanced']
  }

  /**
   * Estimate processing time based on image size and scale factor
   */
  static estimateProcessingTime(
    imageSize: number,
    scaleFactor: number
  ): number {
    // Base time in seconds
    const baseTime = 2
    const sizeMultiplier = Math.log10(imageSize / (1024 * 1024)) + 1
    const scaleMultiplier = Math.log2(scaleFactor) + 1
    
    return Math.max(baseTime * sizeMultiplier * scaleMultiplier, 1)
  }
}
