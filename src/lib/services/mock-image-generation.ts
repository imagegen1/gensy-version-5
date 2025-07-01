/**
 * Mock Image Generation Service for Gensy AI Creative Suite
 * Provides mock image generation for development/testing when Google Cloud is not available
 */

import sharp from 'sharp'

export interface MockImageGenerationOptions {
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'
  style?: 'realistic' | 'artistic' | 'cartoon' | 'abstract' | 'photographic'
  quality?: 'standard' | 'high' | 'ultra'
}

export interface MockImageGenerationResult {
  success: boolean
  imageData?: string // Base64 encoded image data
  metadata?: {
    prompt: string
    options: MockImageGenerationOptions
    model: string
    generationTime: number
  }
  error?: string
}

export class MockImageGenerationService {
  /**
   * Generate a mock image with text overlay showing the prompt
   */
  static async generateMockImage(
    prompt: string,
    options: MockImageGenerationOptions = {}
  ): Promise<MockImageGenerationResult> {
    const startTime = Date.now()

    try {
      // Validate prompt
      if (!prompt || prompt.trim().length < 3) {
        throw new Error('Prompt must be at least 3 characters long')
      }

      // Set default options
      const finalOptions: MockImageGenerationOptions = {
        aspectRatio: options.aspectRatio || '1:1',
        style: options.style || 'realistic',
        quality: options.quality || 'standard'
      }

      // Calculate dimensions based on aspect ratio
      const dimensions = this.getAspectRatioDimensions(finalOptions.aspectRatio!)
      
      // Generate background color based on style
      const backgroundColor = this.getStyleColor(finalOptions.style!)
      
      // Create a mock image with text
      const svgText = this.createSVGWithText(
        prompt,
        dimensions.width,
        dimensions.height,
        backgroundColor,
        finalOptions.style!
      )

      // Convert SVG to PNG using Sharp
      const imageBuffer = await sharp(Buffer.from(svgText))
        .png()
        .toBuffer()

      // Convert to base64
      const imageData = imageBuffer.toString('base64')
      const generationTime = Date.now() - startTime

      return {
        success: true,
        imageData,
        metadata: {
          prompt,
          options: finalOptions,
          model: 'mock-image-generator',
          generationTime
        }
      }

    } catch (error) {
      console.error('Mock image generation error:', error)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          prompt,
          options,
          model: 'mock-image-generator',
          generationTime: Date.now() - startTime
        }
      }
    }
  }

  /**
   * Get dimensions based on aspect ratio
   */
  private static getAspectRatioDimensions(aspectRatio: string): { width: number; height: number } {
    switch (aspectRatio) {
      case '1:1':
        return { width: 1024, height: 1024 }
      case '16:9':
        return { width: 1024, height: 576 }
      case '9:16':
        return { width: 576, height: 1024 }
      case '4:3':
        return { width: 1024, height: 768 }
      case '3:4':
        return { width: 768, height: 1024 }
      default:
        return { width: 1024, height: 1024 }
    }
  }

  /**
   * Get background color based on style
   */
  private static getStyleColor(style: string): string {
    switch (style) {
      case 'realistic':
        return '#4A90E2'
      case 'artistic':
        return '#9B59B6'
      case 'cartoon':
        return '#F39C12'
      case 'abstract':
        return '#E74C3C'
      case 'photographic':
        return '#2ECC71'
      default:
        return '#34495E'
    }
  }

  /**
   * Create SVG with text overlay
   */
  private static createSVGWithText(
    prompt: string,
    width: number,
    height: number,
    backgroundColor: string,
    style: string
  ): string {
    // Truncate prompt if too long
    const displayPrompt = prompt.length > 100 ? prompt.substring(0, 100) + '...' : prompt
    
    // Calculate font size based on image size
    const fontSize = Math.max(16, Math.min(width / 20, 48))
    
    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${backgroundColor};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${this.lightenColor(backgroundColor)};stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Background -->
        <rect width="100%" height="100%" fill="url(#grad1)" />
        
        <!-- Decorative elements based on style -->
        ${this.getStyleDecorations(style, width, height)}
        
        <!-- Main text -->
        <text x="50%" y="40%" 
              font-family="Arial, sans-serif" 
              font-size="${fontSize}" 
              font-weight="bold"
              fill="white" 
              text-anchor="middle" 
              dominant-baseline="middle">
          Generated Image
        </text>
        
        <!-- Prompt text -->
        <foreignObject x="10%" y="50%" width="80%" height="40%">
          <div xmlns="http://www.w3.org/1999/xhtml" 
               style="color: white; 
                      font-family: Arial, sans-serif; 
                      font-size: ${fontSize * 0.6}px; 
                      text-align: center; 
                      padding: 20px;
                      background: rgba(0,0,0,0.3);
                      border-radius: 10px;
                      word-wrap: break-word;">
            "${displayPrompt}"
          </div>
        </foreignObject>
        
        <!-- Style indicator -->
        <text x="50%" y="90%" 
              font-family="Arial, sans-serif" 
              font-size="${fontSize * 0.5}" 
              fill="rgba(255,255,255,0.8)" 
              text-anchor="middle">
          Style: ${style.charAt(0).toUpperCase() + style.slice(1)} | ${width}×${height}
        </text>
      </svg>
    `
  }

  /**
   * Get style-specific decorations
   */
  private static getStyleDecorations(style: string, width: number, height: number): string {
    switch (style) {
      case 'artistic':
        return `
          <circle cx="20%" cy="20%" r="50" fill="rgba(255,255,255,0.1)" />
          <circle cx="80%" cy="80%" r="30" fill="rgba(255,255,255,0.1)" />
        `
      case 'cartoon':
        return `
          <polygon points="100,50 150,100 50,100" fill="rgba(255,255,255,0.2)" />
          <polygon points="${width-100},${height-50} ${width-50},${height-100} ${width-150},${height-100}" fill="rgba(255,255,255,0.2)" />
        `
      case 'abstract':
        return `
          <path d="M0,${height/2} Q${width/4},${height/4} ${width/2},${height/2} T${width},${height/2}" 
                stroke="rgba(255,255,255,0.3)" stroke-width="3" fill="none" />
        `
      default:
        return ''
    }
  }

  /**
   * Lighten a hex color
   */
  private static lightenColor(color: string): string {
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    
    const lightenedR = Math.min(255, r + 40)
    const lightenedG = Math.min(255, g + 40)
    const lightenedB = Math.min(255, b + 40)
    
    return `#${lightenedR.toString(16).padStart(2, '0')}${lightenedG.toString(16).padStart(2, '0')}${lightenedB.toString(16).padStart(2, '0')}`
  }
}
