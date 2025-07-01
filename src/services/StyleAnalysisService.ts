/**
 * StyleAnalysisService - Intelligent style detection for uploaded images
 * Analyzes visual characteristics and suggests appropriate artistic styles
 */

export interface StyleAnalysisResult {
  suggestedStyles: StyleSuggestion[]
  imageCharacteristics: ImageCharacteristics
  confidence: number
  processingTime: number
}

export interface StyleSuggestion {
  style: string
  confidence: number
  reasoning: string[]
  characteristics: string[]
}

export interface ImageCharacteristics {
  dominantColors: ColorInfo[]
  brightness: number
  contrast: number
  saturation: number
  colorfulness: number
  hasHighDetail: boolean
  hasGeometricShapes: boolean
  hasOrganicShapes: boolean
  textureComplexity: 'low' | 'medium' | 'high'
  compositionType: 'centered' | 'rule-of-thirds' | 'dynamic' | 'abstract'
}

export interface ColorInfo {
  hex: string
  rgb: [number, number, number]
  percentage: number
  name: string
}

// Style mapping configuration
const STYLE_CHARACTERISTICS = {
  realistic: {
    keywords: ['natural', 'photographic', 'detailed', 'lifelike'],
    colorProfile: { saturation: [0.3, 0.8], brightness: [0.2, 0.8] },
    textureComplexity: ['medium', 'high'],
    preferredComposition: ['centered', 'rule-of-thirds']
  },
  artistic: {
    keywords: ['painterly', 'expressive', 'creative', 'stylized'],
    colorProfile: { saturation: [0.4, 1.0], brightness: [0.1, 0.9] },
    textureComplexity: ['medium', 'high'],
    preferredComposition: ['rule-of-thirds', 'dynamic']
  },
  cartoon: {
    keywords: ['bold', 'simplified', 'colorful', 'stylized'],
    colorProfile: { saturation: [0.6, 1.0], brightness: [0.3, 0.9] },
    textureComplexity: ['low', 'medium'],
    preferredComposition: ['centered', 'dynamic']
  },
  abstract: {
    keywords: ['geometric', 'non-representational', 'conceptual', 'experimental'],
    colorProfile: { saturation: [0.2, 1.0], brightness: [0.0, 1.0] },
    textureComplexity: ['low', 'medium', 'high'],
    preferredComposition: ['abstract', 'dynamic']
  },
  photographic: {
    keywords: ['sharp', 'professional', 'realistic', 'documentary'],
    colorProfile: { saturation: [0.2, 0.7], brightness: [0.2, 0.8] },
    textureComplexity: ['high'],
    preferredComposition: ['rule-of-thirds', 'centered']
  },
  cinematic: {
    keywords: ['dramatic', 'moody', 'atmospheric', 'film-like'],
    colorProfile: { saturation: [0.3, 0.8], brightness: [0.1, 0.7] },
    textureComplexity: ['medium', 'high'],
    preferredComposition: ['rule-of-thirds', 'dynamic']
  },
  vintage: {
    keywords: ['aged', 'nostalgic', 'retro', 'classic'],
    colorProfile: { saturation: [0.2, 0.6], brightness: [0.2, 0.7] },
    textureComplexity: ['medium'],
    preferredComposition: ['centered', 'rule-of-thirds']
  },
  watercolor: {
    keywords: ['soft', 'flowing', 'translucent', 'organic'],
    colorProfile: { saturation: [0.3, 0.8], brightness: [0.3, 0.9] },
    textureComplexity: ['low', 'medium'],
    preferredComposition: ['organic', 'dynamic']
  }
} as const

export class StyleAnalysisService {
  private static instance: StyleAnalysisService
  
  public static getInstance(): StyleAnalysisService {
    if (!StyleAnalysisService.instance) {
      StyleAnalysisService.instance = new StyleAnalysisService()
    }
    return StyleAnalysisService.instance
  }

  /**
   * Analyze an image and suggest appropriate styles
   */
  public async analyzeImage(imageFile: File): Promise<StyleAnalysisResult> {
    const startTime = Date.now()
    
    try {
      // Create image element for analysis
      const imageElement = await this.loadImageFromFile(imageFile)
      
      // Extract image characteristics
      const characteristics = await this.extractImageCharacteristics(imageElement)
      
      // Generate style suggestions based on characteristics
      const suggestedStyles = this.generateStyleSuggestions(characteristics)
      
      // Calculate overall confidence
      const confidence = this.calculateOverallConfidence(suggestedStyles)
      
      const processingTime = Date.now() - startTime
      
      return {
        suggestedStyles,
        imageCharacteristics: characteristics,
        confidence,
        processingTime
      }
    } catch (error) {
      console.error('Style analysis failed:', error)
      throw new Error('Failed to analyze image style')
    }
  }

  /**
   * Load image from file into HTMLImageElement
   */
  private loadImageFromFile(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      
      img.onload = () => {
        URL.revokeObjectURL(url)
        resolve(img)
      }
      
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load image'))
      }
      
      img.src = url
    })
  }

  /**
   * Extract visual characteristics from image
   */
  private async extractImageCharacteristics(image: HTMLImageElement): Promise<ImageCharacteristics> {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    
    // Resize for analysis (smaller = faster)
    const maxSize = 200
    const scale = Math.min(maxSize / image.width, maxSize / image.height)
    canvas.width = image.width * scale
    canvas.height = image.height * scale
    
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const pixels = imageData.data
    
    // Analyze color distribution
    const colorAnalysis = this.analyzeColors(pixels)
    
    // Analyze brightness and contrast
    const brightnessContrast = this.analyzeBrightnessContrast(pixels)
    
    // Analyze saturation
    const saturation = this.analyzeSaturation(pixels)
    
    // Analyze texture complexity (simplified)
    const textureComplexity = this.analyzeTextureComplexity(pixels, canvas.width, canvas.height)
    
    // Analyze composition (simplified)
    const compositionType = this.analyzeComposition(pixels, canvas.width, canvas.height)
    
    return {
      dominantColors: colorAnalysis.dominantColors,
      brightness: brightnessContrast.brightness,
      contrast: brightnessContrast.contrast,
      saturation: saturation,
      colorfulness: colorAnalysis.colorfulness,
      hasHighDetail: textureComplexity === 'high',
      hasGeometricShapes: this.detectGeometricShapes(pixels, canvas.width, canvas.height),
      hasOrganicShapes: this.detectOrganicShapes(pixels, canvas.width, canvas.height),
      textureComplexity,
      compositionType
    }
  }

  /**
   * Analyze color distribution and extract dominant colors
   */
  private analyzeColors(pixels: Uint8ClampedArray) {
    const colorMap = new Map<string, number>()
    let totalSaturation = 0
    let pixelCount = 0
    
    // Sample every 4th pixel for performance
    for (let i = 0; i < pixels.length; i += 16) {
      const r = pixels[i]
      const g = pixels[i + 1]
      const b = pixels[i + 2]
      
      // Quantize colors to reduce noise
      const quantizedR = Math.floor(r / 32) * 32
      const quantizedG = Math.floor(g / 32) * 32
      const quantizedB = Math.floor(b / 32) * 32
      
      const colorKey = `${quantizedR},${quantizedG},${quantizedB}`
      colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1)
      
      // Calculate saturation for this pixel
      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      const saturation = max === 0 ? 0 : (max - min) / max
      totalSaturation += saturation
      pixelCount++
    }
    
    // Get top 5 dominant colors
    const sortedColors = Array.from(colorMap.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
    
    const totalPixels = sortedColors.reduce((sum, [, count]) => sum + count, 0)
    
    const dominantColors: ColorInfo[] = sortedColors.map(([colorKey, count]) => {
      const [r, g, b] = colorKey.split(',').map(Number)
      return {
        hex: `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`,
        rgb: [r, g, b] as [number, number, number],
        percentage: (count / totalPixels) * 100,
        name: this.getColorName(r, g, b)
      }
    })
    
    const averageSaturation = totalSaturation / pixelCount
    
    return {
      dominantColors,
      colorfulness: averageSaturation
    }
  }

  /**
   * Analyze brightness and contrast
   */
  private analyzeBrightnessContrast(pixels: Uint8ClampedArray) {
    let totalBrightness = 0
    let pixelCount = 0
    const brightnessValues: number[] = []
    
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i]
      const g = pixels[i + 1]
      const b = pixels[i + 2]
      
      // Calculate perceived brightness
      const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255
      totalBrightness += brightness
      brightnessValues.push(brightness)
      pixelCount++
    }
    
    const averageBrightness = totalBrightness / pixelCount
    
    // Calculate contrast as standard deviation of brightness
    const variance = brightnessValues.reduce((sum, brightness) => {
      return sum + Math.pow(brightness - averageBrightness, 2)
    }, 0) / pixelCount
    
    const contrast = Math.sqrt(variance)
    
    return {
      brightness: averageBrightness,
      contrast: contrast
    }
  }

  /**
   * Analyze overall saturation
   */
  private analyzeSaturation(pixels: Uint8ClampedArray): number {
    let totalSaturation = 0
    let pixelCount = 0
    
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i] / 255
      const g = pixels[i + 1] / 255
      const b = pixels[i + 2] / 255
      
      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      const saturation = max === 0 ? 0 : (max - min) / max
      
      totalSaturation += saturation
      pixelCount++
    }
    
    return totalSaturation / pixelCount
  }

  /**
   * Analyze texture complexity (simplified edge detection)
   */
  private analyzeTextureComplexity(pixels: Uint8ClampedArray, width: number, height: number): 'low' | 'medium' | 'high' {
    let edgeCount = 0
    const threshold = 30
    
    // Simple edge detection using brightness differences
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4
        const currentBrightness = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3
        
        // Check horizontal and vertical neighbors
        const rightIdx = (y * width + x + 1) * 4
        const bottomIdx = ((y + 1) * width + x) * 4
        
        const rightBrightness = (pixels[rightIdx] + pixels[rightIdx + 1] + pixels[rightIdx + 2]) / 3
        const bottomBrightness = (pixels[bottomIdx] + pixels[bottomIdx + 1] + pixels[bottomIdx + 2]) / 3
        
        if (Math.abs(currentBrightness - rightBrightness) > threshold ||
            Math.abs(currentBrightness - bottomBrightness) > threshold) {
          edgeCount++
        }
      }
    }
    
    const edgeRatio = edgeCount / (width * height)
    
    if (edgeRatio > 0.15) return 'high'
    if (edgeRatio > 0.05) return 'medium'
    return 'low'
  }

  /**
   * Analyze composition type (simplified)
   */
  private analyzeComposition(pixels: Uint8ClampedArray, width: number, height: number): 'centered' | 'rule-of-thirds' | 'dynamic' | 'abstract' {
    // This is a simplified analysis - in a real implementation, you'd use more sophisticated techniques
    const centerX = width / 2
    const centerY = height / 2
    
    // Analyze brightness distribution
    let centerBrightness = 0
    let edgeBrightness = 0
    let centerPixels = 0
    let edgePixels = 0
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4
        const brightness = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3
        
        const distanceFromCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2))
        const maxDistance = Math.sqrt(Math.pow(centerX, 2) + Math.pow(centerY, 2))
        
        if (distanceFromCenter < maxDistance * 0.3) {
          centerBrightness += brightness
          centerPixels++
        } else if (distanceFromCenter > maxDistance * 0.7) {
          edgeBrightness += brightness
          edgePixels++
        }
      }
    }
    
    const avgCenterBrightness = centerPixels > 0 ? centerBrightness / centerPixels : 0
    const avgEdgeBrightness = edgePixels > 0 ? edgeBrightness / edgePixels : 0
    
    // Simple heuristics for composition detection
    if (Math.abs(avgCenterBrightness - avgEdgeBrightness) < 20) {
      return 'abstract'
    } else if (avgCenterBrightness > avgEdgeBrightness + 30) {
      return 'centered'
    } else {
      return 'rule-of-thirds'
    }
  }

  /**
   * Detect geometric shapes (simplified)
   */
  private detectGeometricShapes(pixels: Uint8ClampedArray, width: number, height: number): boolean {
    // Simplified detection based on edge patterns
    // In a real implementation, you'd use more sophisticated shape detection
    return Math.random() > 0.5 // Placeholder
  }

  /**
   * Detect organic shapes (simplified)
   */
  private detectOrganicShapes(pixels: Uint8ClampedArray, width: number, height: number): boolean {
    // Simplified detection based on curve patterns
    // In a real implementation, you'd use more sophisticated shape detection
    return Math.random() > 0.5 // Placeholder
  }

  /**
   * Get color name from RGB values (simplified)
   */
  private getColorName(r: number, g: number, b: number): string {
    // Simplified color naming
    if (r > 200 && g > 200 && b > 200) return 'Light'
    if (r < 50 && g < 50 && b < 50) return 'Dark'
    if (r > g && r > b) return 'Red'
    if (g > r && g > b) return 'Green'
    if (b > r && b > g) return 'Blue'
    if (r > 150 && g > 150 && b < 100) return 'Yellow'
    if (r > 150 && g < 100 && b > 150) return 'Purple'
    if (r < 100 && g > 150 && b > 150) return 'Cyan'
    return 'Mixed'
  }

  /**
   * Generate style suggestions based on image characteristics
   */
  private generateStyleSuggestions(characteristics: ImageCharacteristics): StyleSuggestion[] {
    const suggestions: StyleSuggestion[] = []

    // Analyze each style against the image characteristics
    for (const [styleName, styleConfig] of Object.entries(STYLE_CHARACTERISTICS)) {
      const confidence = this.calculateStyleConfidence(characteristics, styleConfig)
      const reasoning = this.generateReasoning(characteristics, styleConfig)
      const styleCharacteristics = this.getStyleCharacteristics(characteristics, styleConfig)

      suggestions.push({
        style: styleName,
        confidence,
        reasoning,
        characteristics: styleCharacteristics
      })
    }

    // Sort by confidence and return top 3
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3)
  }

  /**
   * Calculate confidence score for a specific style
   */
  private calculateStyleConfidence(characteristics: ImageCharacteristics, styleConfig: any): number {
    let score = 0
    let factors = 0

    // Check saturation match
    const satRange = styleConfig.colorProfile.saturation
    if (characteristics.saturation >= satRange[0] && characteristics.saturation <= satRange[1]) {
      score += 0.3
    } else {
      // Partial score based on how close it is
      const distance = Math.min(
        Math.abs(characteristics.saturation - satRange[0]),
        Math.abs(characteristics.saturation - satRange[1])
      )
      score += Math.max(0, 0.3 - distance * 0.5)
    }
    factors += 0.3

    // Check brightness match
    const brightRange = styleConfig.colorProfile.brightness
    if (characteristics.brightness >= brightRange[0] && characteristics.brightness <= brightRange[1]) {
      score += 0.25
    } else {
      const distance = Math.min(
        Math.abs(characteristics.brightness - brightRange[0]),
        Math.abs(characteristics.brightness - brightRange[1])
      )
      score += Math.max(0, 0.25 - distance * 0.4)
    }
    factors += 0.25

    // Check texture complexity match
    if (styleConfig.textureComplexity.includes(characteristics.textureComplexity)) {
      score += 0.2
    }
    factors += 0.2

    // Check composition match
    if (styleConfig.preferredComposition.includes(characteristics.compositionType)) {
      score += 0.15
    }
    factors += 0.15

    // Bonus factors
    if (characteristics.hasHighDetail && ['realistic', 'photographic', 'cinematic'].includes(styleConfig)) {
      score += 0.1
    }

    return Math.min(1, score / factors)
  }

  /**
   * Generate reasoning for style suggestion
   */
  private generateReasoning(characteristics: ImageCharacteristics, styleConfig: any): string[] {
    const reasons: string[] = []

    // Saturation reasoning
    if (characteristics.saturation > 0.7) {
      reasons.push('High color saturation suggests vibrant, expressive style')
    } else if (characteristics.saturation < 0.3) {
      reasons.push('Low saturation indicates muted, realistic tones')
    }

    // Brightness reasoning
    if (characteristics.brightness > 0.7) {
      reasons.push('Bright image suggests cheerful, optimistic style')
    } else if (characteristics.brightness < 0.3) {
      reasons.push('Dark tones suggest dramatic, moody atmosphere')
    }

    // Texture reasoning
    if (characteristics.textureComplexity === 'high') {
      reasons.push('High detail level indicates realistic or photographic style')
    } else if (characteristics.textureComplexity === 'low') {
      reasons.push('Simple textures suggest stylized or cartoon-like approach')
    }

    // Color reasoning
    const dominantColor = characteristics.dominantColors[0]
    if (dominantColor) {
      if (dominantColor.name === 'Red') {
        reasons.push('Dominant red tones suggest dramatic or artistic style')
      } else if (dominantColor.name === 'Blue') {
        reasons.push('Blue tones indicate calm, photographic quality')
      }
    }

    return reasons.slice(0, 3) // Limit to top 3 reasons
  }

  /**
   * Get style characteristics description
   */
  private getStyleCharacteristics(characteristics: ImageCharacteristics, styleConfig: any): string[] {
    const styleChars: string[] = []

    if (characteristics.contrast > 0.3) {
      styleChars.push('High contrast')
    }

    if (characteristics.colorfulness > 0.6) {
      styleChars.push('Vibrant colors')
    }

    if (characteristics.hasHighDetail) {
      styleChars.push('Rich detail')
    }

    styleChars.push(`${characteristics.textureComplexity} complexity`)

    return styleChars
  }

  /**
   * Calculate overall confidence across all suggestions
   */
  private calculateOverallConfidence(suggestions: StyleSuggestion[]): number {
    if (suggestions.length === 0) return 0

    // Use the highest confidence as overall confidence
    const maxConfidence = Math.max(...suggestions.map(s => s.confidence))

    // Adjust based on the spread of confidences
    const confidences = suggestions.map(s => s.confidence)
    const average = confidences.reduce((a, b) => a + b, 0) / confidences.length
    const spread = Math.max(...confidences) - Math.min(...confidences)

    // Higher spread means more certainty about the top choice
    const spreadBonus = spread * 0.2

    return Math.min(1, maxConfidence + spreadBonus)
  }

  /**
   * Get a quick style suggestion without full analysis (for preview)
   */
  public async getQuickStyleSuggestion(imageFile: File): Promise<string> {
    try {
      const result = await this.analyzeImage(imageFile)
      return result.suggestedStyles[0]?.style || 'realistic'
    } catch (error) {
      console.error('Quick style analysis failed:', error)
      return 'realistic' // Fallback
    }
  }
}
