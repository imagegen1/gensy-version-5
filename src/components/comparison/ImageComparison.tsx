'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { 
  ArrowLeftRightIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline'

interface ImageComparisonProps {
  original: string | File
  upscaled: string
  metadata?: {
    scaleFactor?: number
    originalSize?: { width: number; height: number }
    upscaledSize?: { width: number; height: number }
  }
}

type ComparisonMode = 'slider' | 'side-by-side' | 'overlay' | 'flicker'

export function ImageComparison({ 
  original, 
  upscaled, 
  metadata 
}: ImageComparisonProps) {
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('slider')
  const [sliderPosition, setSliderPosition] = useState(50)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [focusPoint, setFocusPoint] = useState({ x: 0.5, y: 0.5 })
  const [overlayOpacity, setOverlayOpacity] = useState(50)
  const [flickerInterval, setFlickerInterval] = useState<NodeJS.Timeout | null>(null)
  const [showOriginal, setShowOriginal] = useState(true)
  const [originalImageUrl, setOriginalImageUrl] = useState<string>('')

  const containerRef = useRef<HTMLDivElement>(null)

  // Handle File object for original image
  useEffect(() => {
    if (original instanceof File) {
      const url = URL.createObjectURL(original)
      setOriginalImageUrl(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setOriginalImageUrl(original)
    }
  }, [original])

  // Handle flicker mode
  useEffect(() => {
    if (comparisonMode === 'flicker') {
      const interval = setInterval(() => {
        setShowOriginal(prev => !prev)
      }, 1000)
      setFlickerInterval(interval)
      return () => clearInterval(interval)
    } else {
      if (flickerInterval) {
        clearInterval(flickerInterval)
        setFlickerInterval(null)
      }
      setShowOriginal(true)
    }
  }, [comparisonMode, flickerInterval])

  const handleContainerClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const x = (event.clientX - rect.left) / rect.width
      const y = (event.clientY - rect.top) / rect.height
      setFocusPoint({ x, y })
    }
  }

  const resetView = () => {
    setZoomLevel(1)
    setFocusPoint({ x: 0.5, y: 0.5 })
    setSliderPosition(50)
  }

  const getImageStyle = () => {
    const scale = zoomLevel
    const translateX = (0.5 - focusPoint.x) * 100 * (scale - 1)
    const translateY = (0.5 - focusPoint.y) * 100 * (scale - 1)
    
    return {
      transform: `scale(${scale}) translate(${translateX}%, ${translateY}%)`,
      transformOrigin: 'center'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Controls */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Image Comparison</h3>
          <button
            onClick={resetView}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Reset View
          </button>
        </div>

        {/* Comparison Mode Selector */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { mode: 'slider' as const, label: 'Slider', icon: ArrowLeftRightIcon },
            { mode: 'side-by-side' as const, label: 'Side by Side', icon: EyeIcon },
            { mode: 'overlay' as const, label: 'Overlay', icon: AdjustmentsHorizontalIcon },
            { mode: 'flicker' as const, label: 'Flicker', icon: MagnifyingGlassIcon },
          ].map(({ mode, label, icon: Icon }) => (
            <button
              key={mode}
              onClick={() => setComparisonMode(mode)}
              className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                comparisonMode === mode
                  ? 'bg-primary-100 text-primary-700 border border-primary-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon className="h-4 w-4 mr-1" />
              {label}
            </button>
          ))}
        </div>

        {/* Mode-specific Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Zoom Control */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Zoom: {zoomLevel.toFixed(1)}x
            </label>
            <input
              type="range"
              min="1"
              max="5"
              step="0.1"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Slider Position (for slider mode) */}
          {comparisonMode === 'slider' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Split Position: {sliderPosition}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPosition}
                onChange={(e) => setSliderPosition(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}

          {/* Overlay Opacity (for overlay mode) */}
          {comparisonMode === 'overlay' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Overlay Opacity: {overlayOpacity}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={overlayOpacity}
                onChange={(e) => setOverlayOpacity(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>

      {/* Comparison Container */}
      <div 
        ref={containerRef}
        className="relative aspect-video bg-gray-100 overflow-hidden cursor-crosshair"
        onClick={handleContainerClick}
      >
        {/* Side by Side Mode */}
        {comparisonMode === 'side-by-side' && (
          <div className="grid grid-cols-2 gap-1 h-full">
            <div className="relative bg-gray-200">
              <Image
                src={originalImageUrl}
                alt="Original"
                fill
                className="object-contain"
                style={getImageStyle()}
              />
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                Original
              </div>
            </div>
            <div className="relative bg-gray-200">
              <Image
                src={upscaled}
                alt="Upscaled"
                fill
                className="object-contain"
                style={getImageStyle()}
              />
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                Upscaled {metadata?.scaleFactor}x
              </div>
            </div>
          </div>
        )}

        {/* Slider Mode */}
        {comparisonMode === 'slider' && (
          <div className="relative h-full">
            <Image
              src={originalImageUrl}
              alt="Original"
              fill
              className="object-contain"
              style={getImageStyle()}
            />
            <div 
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
              <Image
                src={upscaled}
                alt="Upscaled"
                fill
                className="object-contain"
                style={getImageStyle()}
              />
            </div>
            
            {/* Slider Line */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none"
              style={{ left: `${sliderPosition}%` }}
            />
            
            {/* Labels */}
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
              Original
            </div>
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
              Upscaled {metadata?.scaleFactor}x
            </div>
          </div>
        )}

        {/* Overlay Mode */}
        {comparisonMode === 'overlay' && (
          <div className="relative h-full">
            <Image
              src={originalImageUrl}
              alt="Original"
              fill
              className="object-contain"
              style={getImageStyle()}
            />
            <div 
              className="absolute inset-0"
              style={{ opacity: overlayOpacity / 100 }}
            >
              <Image
                src={upscaled}
                alt="Upscaled"
                fill
                className="object-contain"
                style={getImageStyle()}
              />
            </div>
            
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
              Overlay Mode - {overlayOpacity}% opacity
            </div>
          </div>
        )}

        {/* Flicker Mode */}
        {comparisonMode === 'flicker' && (
          <div className="relative h-full">
            <Image
              src={showOriginal ? originalImageUrl : upscaled}
              alt={showOriginal ? "Original" : "Upscaled"}
              fill
              className="object-contain transition-opacity duration-200"
              style={getImageStyle()}
            />
            
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
              {showOriginal ? 'Original' : `Upscaled ${metadata?.scaleFactor}x`}
            </div>
          </div>
        )}

        {/* Focus Point Indicator */}
        {zoomLevel > 1 && (
          <div 
            className="absolute w-2 h-2 bg-red-500 rounded-full pointer-events-none transform -translate-x-1 -translate-y-1"
            style={{ 
              left: `${focusPoint.x * 100}%`, 
              top: `${focusPoint.y * 100}%` 
            }}
          />
        )}
      </div>

      {/* Image Information */}
      {metadata && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {metadata.scaleFactor && (
              <div>
                <span className="text-gray-500">Scale Factor:</span>
                <span className="ml-1 font-medium">{metadata.scaleFactor}x</span>
              </div>
            )}
            {metadata.originalSize && (
              <div>
                <span className="text-gray-500">Original:</span>
                <span className="ml-1 font-medium">
                  {metadata.originalSize.width} × {metadata.originalSize.height}
                </span>
              </div>
            )}
            {metadata.upscaledSize && (
              <div>
                <span className="text-gray-500">Upscaled:</span>
                <span className="ml-1 font-medium">
                  {metadata.upscaledSize.width} × {metadata.upscaledSize.height}
                </span>
              </div>
            )}
            <div>
              <span className="text-gray-500">Zoom:</span>
              <span className="ml-1 font-medium">{zoomLevel.toFixed(1)}x</span>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="p-4 bg-blue-50 border-t border-blue-200">
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">💡 Comparison Tips:</p>
          <ul className="text-blue-700 space-y-1 text-xs">
            <li>• Click anywhere on the image to set focus point for zooming</li>
            <li>• Use slider mode to see before/after with precise control</li>
            <li>• Overlay mode helps identify differences in detail</li>
            <li>• Flicker mode quickly shows changes between versions</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
