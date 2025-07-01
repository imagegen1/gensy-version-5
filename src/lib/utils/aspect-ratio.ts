/**
 * Aspect Ratio Utilities for Video Display
 * Ensures videos maintain their selected aspect ratio across all UI components
 */

export interface AspectRatioConfig {
  ratio: string
  width: number
  height: number
  cssClass: string
  containerStyle: React.CSSProperties
}

/**
 * Supported aspect ratios with their configurations
 */
export const ASPECT_RATIO_CONFIGS: Record<string, AspectRatioConfig> = {
  '16:9': {
    ratio: '16:9',
    width: 16,
    height: 9,
    cssClass: 'aspect-video', // Tailwind's built-in 16:9 class
    containerStyle: { aspectRatio: '16/9' }
  },
  '9:16': {
    ratio: '9:16',
    width: 9,
    height: 16,
    cssClass: 'aspect-[9/16]', // Custom Tailwind aspect ratio
    containerStyle: { aspectRatio: '9/16' }
  },
  '1:1': {
    ratio: '1:1',
    width: 1,
    height: 1,
    cssClass: 'aspect-square', // Tailwind's built-in 1:1 class
    containerStyle: { aspectRatio: '1/1' }
  },
  '4:3': {
    ratio: '4:3',
    width: 4,
    height: 3,
    cssClass: 'aspect-[4/3]', // Custom Tailwind aspect ratio
    containerStyle: { aspectRatio: '4/3' }
  },
  '3:4': {
    ratio: '3:4',
    width: 3,
    height: 4,
    cssClass: 'aspect-[3/4]', // Custom Tailwind aspect ratio
    containerStyle: { aspectRatio: '3/4' }
  }
}

/**
 * Get aspect ratio configuration for a given ratio string
 */
export function getAspectRatioConfig(aspectRatio: string): AspectRatioConfig {
  return ASPECT_RATIO_CONFIGS[aspectRatio] || ASPECT_RATIO_CONFIGS['16:9']
}

/**
 * Generate CSS classes for video container based on aspect ratio
 */
export function getVideoContainerClasses(
  aspectRatio: string,
  additionalClasses: string = ''
): string {
  const config = getAspectRatioConfig(aspectRatio)
  return `${config.cssClass} ${additionalClasses}`.trim()
}

/**
 * Generate inline styles for video container based on aspect ratio
 */
export function getVideoContainerStyle(
  aspectRatio: string,
  additionalStyles: React.CSSProperties = {}
): React.CSSProperties {
  const config = getAspectRatioConfig(aspectRatio)
  return {
    ...config.containerStyle,
    ...additionalStyles
  }
}

/**
 * Calculate responsive dimensions for video display
 */
export function calculateResponsiveDimensions(
  aspectRatio: string,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const config = getAspectRatioConfig(aspectRatio)
  const ratio = config.width / config.height
  
  let width = maxWidth
  let height = maxWidth / ratio
  
  // If height exceeds maxHeight, scale down based on height
  if (height > maxHeight) {
    height = maxHeight
    width = maxHeight * ratio
  }
  
  return { width: Math.round(width), height: Math.round(height) }
}

/**
 * Get thumbnail aspect ratio class for gallery view
 */
export function getThumbnailAspectRatio(aspectRatio: string): string {
  const config = getAspectRatioConfig(aspectRatio)
  return config.cssClass
}

/**
 * Check if aspect ratio is portrait orientation
 */
export function isPortraitAspectRatio(aspectRatio: string): boolean {
  const config = getAspectRatioConfig(aspectRatio)
  return config.height > config.width
}

/**
 * Check if aspect ratio is landscape orientation
 */
export function isLandscapeAspectRatio(aspectRatio: string): boolean {
  const config = getAspectRatioConfig(aspectRatio)
  return config.width > config.height
}

/**
 * Check if aspect ratio is square
 */
export function isSquareAspectRatio(aspectRatio: string): boolean {
  const config = getAspectRatioConfig(aspectRatio)
  return config.width === config.height
}

/**
 * Get modal container classes based on aspect ratio for responsive display
 */
export function getModalContainerClasses(aspectRatio: string): string {
  if (isPortraitAspectRatio(aspectRatio)) {
    return 'max-w-2xl' // Narrower for portrait videos
  } else if (isLandscapeAspectRatio(aspectRatio)) {
    return 'max-w-4xl' // Wider for landscape videos
  } else {
    return 'max-w-3xl' // Medium for square videos
  }
}

/**
 * Generate CSS custom properties for aspect ratio
 */
export function getAspectRatioCustomProperties(aspectRatio: string): Record<string, string> {
  const config = getAspectRatioConfig(aspectRatio)
  return {
    '--aspect-ratio': `${config.width}/${config.height}`,
    '--aspect-width': config.width.toString(),
    '--aspect-height': config.height.toString()
  }
}

/**
 * Get layout configuration for different aspect ratios
 */
export interface LayoutConfig {
  containerClasses: string
  videoClasses: string
  metadataLayout: 'horizontal' | 'vertical' | 'grid'
  controlsPosition: 'bottom' | 'side' | 'overlay'
  maxWidth: string
  spacing: string
}

export function getLayoutConfig(aspectRatio: string): LayoutConfig {
  if (isLandscapeAspectRatio(aspectRatio)) {
    return {
      containerClasses: 'flex flex-col lg:flex-row gap-6',
      videoClasses: 'flex-1 max-w-4xl',
      metadataLayout: 'vertical',
      controlsPosition: 'bottom',
      maxWidth: 'max-w-6xl',
      spacing: 'space-y-4 lg:space-y-0 lg:space-x-6'
    }
  } else if (isPortraitAspectRatio(aspectRatio)) {
    return {
      containerClasses: 'flex flex-col items-center gap-4',
      videoClasses: 'w-full max-w-md lg:max-w-lg',
      metadataLayout: 'horizontal',
      controlsPosition: 'bottom',
      maxWidth: 'max-w-2xl',
      spacing: 'space-y-4'
    }
  } else {
    // Square videos
    return {
      containerClasses: 'flex flex-col lg:flex-row gap-6',
      videoClasses: 'flex-1 max-w-2xl',
      metadataLayout: 'grid',
      controlsPosition: 'bottom',
      maxWidth: 'max-w-4xl',
      spacing: 'space-y-4 lg:space-y-0 lg:space-x-6'
    }
  }
}

/**
 * Get responsive video container classes based on aspect ratio
 */
export function getResponsiveVideoClasses(aspectRatio: string): string {
  const baseClasses = 'relative bg-black rounded-lg overflow-hidden'
  const aspectClasses = getVideoContainerClasses(aspectRatio)

  if (isLandscapeAspectRatio(aspectRatio)) {
    return `${baseClasses} ${aspectClasses} w-full max-w-4xl mx-auto`
  } else if (isPortraitAspectRatio(aspectRatio)) {
    return `${baseClasses} ${aspectClasses} w-full max-w-md mx-auto lg:max-w-lg`
  } else {
    return `${baseClasses} ${aspectClasses} w-full max-w-2xl mx-auto`
  }
}

/**
 * Get metadata grid classes based on aspect ratio and layout
 */
export function getMetadataGridClasses(aspectRatio: string, layout: 'horizontal' | 'vertical' | 'grid' = 'grid'): string {
  const baseClasses = 'gap-4 text-sm'

  if (layout === 'horizontal') {
    return `${baseClasses} grid grid-cols-2 sm:grid-cols-4`
  } else if (layout === 'vertical') {
    return `${baseClasses} grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2`
  } else {
    // Grid layout
    return `${baseClasses} grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4`
  }
}

/**
 * Get action buttons layout classes based on aspect ratio
 */
export function getActionButtonsClasses(aspectRatio: string): string {
  if (isPortraitAspectRatio(aspectRatio)) {
    return 'flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-gray-200'
  } else {
    return 'flex items-center justify-between pt-4 border-t border-gray-200'
  }
}

/**
 * Get gallery thumbnail classes for responsive grid
 */
export function getGalleryThumbnailClasses(aspectRatio: string): string {
  const baseClasses = 'relative bg-gray-100 overflow-hidden rounded-lg'
  const aspectClasses = getThumbnailAspectRatio(aspectRatio)

  if (isPortraitAspectRatio(aspectRatio)) {
    return `${baseClasses} ${aspectClasses} max-w-xs mx-auto`
  } else if (isLandscapeAspectRatio(aspectRatio)) {
    return `${baseClasses} ${aspectClasses} w-full`
  } else {
    return `${baseClasses} ${aspectClasses} max-w-sm mx-auto`
  }
}
