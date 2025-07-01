'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  PaintBrushIcon, 
  ChevronDownIcon,
  CheckIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

export interface StyleOption {
  value: string
  label: string
  description: string
  icon: string
  preview?: string
  category?: string
}

interface StyleSelectorProps {
  selectedStyle: string
  onStyleChange: (style: string) => void
  disabled?: boolean
  showTooltips?: boolean
  variant?: 'dropdown' | 'grid' | 'compact'
  className?: string
}

export const DEFAULT_STYLES: StyleOption[] = [
  { 
    value: 'realistic', 
    label: 'Realistic', 
    description: 'Photorealistic images with natural lighting and textures',
    icon: '📸',
    category: 'Photography'
  },
  { 
    value: 'artistic', 
    label: 'Artistic', 
    description: 'Painterly style with creative interpretation and artistic flair',
    icon: '🎨',
    category: 'Art'
  },
  { 
    value: 'cartoon', 
    label: 'Cartoon', 
    description: 'Animated style with bold colors and stylized features',
    icon: '🎭',
    category: 'Animation'
  },
  { 
    value: 'abstract', 
    label: 'Abstract', 
    description: 'Non-representational art with emphasis on form and color',
    icon: '🌀',
    category: 'Art'
  },
  { 
    value: 'photographic', 
    label: 'Photographic', 
    description: 'Camera-like quality with professional photography aesthetics',
    icon: '📷',
    category: 'Photography'
  },
  {
    value: 'cinematic',
    label: 'Cinematic',
    description: 'Movie-like quality with dramatic lighting and composition',
    icon: '🎬',
    category: 'Film'
  },
  {
    value: 'vintage',
    label: 'Vintage',
    description: 'Retro aesthetic with aged textures and classic color palettes',
    icon: '📻',
    category: 'Retro'
  },
  {
    value: 'watercolor',
    label: 'Watercolor',
    description: 'Soft, flowing watercolor painting style with translucent effects',
    icon: '🎨',
    category: 'Art'
  }
]

export function StyleSelector({
  selectedStyle,
  onStyleChange,
  disabled = false,
  showTooltips = true,
  variant = 'dropdown',
  className = ''
}: StyleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hoveredStyle, setHoveredStyle] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedStyleData = DEFAULT_STYLES.find(style => style.value === selectedStyle)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleStyleSelect = (styleValue: string) => {
    onStyleChange(styleValue)
    setIsOpen(false)
  }

  if (variant === 'grid') {
    return (
      <div className={`space-y-3 ${className}`}>
        <label className="block text-sm font-medium text-gray-700">
          <PaintBrushIcon className="h-4 w-4 inline mr-1" />
          Style
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {DEFAULT_STYLES.map((style) => (
            <button
              key={style.value}
              onClick={() => handleStyleSelect(style.value)}
              disabled={disabled}
              className={`relative p-4 rounded-lg border-2 text-center transition-all duration-200 group ${
                selectedStyle === style.value
                  ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-md'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300 hover:shadow-sm'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={showTooltips ? style.description : undefined}
            >
              <div className="text-2xl mb-2">{style.icon}</div>
              <div className="text-sm font-medium">{style.label}</div>
              {selectedStyle === style.value && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                  <CheckIcon className="w-3 h-3 text-white" />
                </div>
              )}
              {showTooltips && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
                  {style.description}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <PaintBrushIcon className="h-4 w-4 text-gray-500" />
        <select
          value={selectedStyle}
          onChange={(e) => handleStyleSelect(e.target.value)}
          disabled={disabled}
          className="text-sm border-0 bg-transparent focus:ring-0 focus:outline-none text-gray-700 font-medium"
        >
          {DEFAULT_STYLES.map((style) => (
            <option key={style.value} value={style.value}>
              {style.icon} {style.label}
            </option>
          ))}
        </select>
      </div>
    )
  }

  // Default dropdown variant
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        <PaintBrushIcon className="h-4 w-4 inline mr-1" />
        Style
      </label>
      
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
          disabled ? 'bg-gray-50 cursor-not-allowed' : 'hover:border-gray-400'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-lg">{selectedStyleData?.icon}</span>
            <div>
              <div className="font-medium text-gray-900">{selectedStyleData?.label}</div>
              <div className="text-sm text-gray-500">{selectedStyleData?.category}</div>
            </div>
          </div>
          <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          <div className="py-2">
            {DEFAULT_STYLES.map((style) => (
              <button
                key={style.value}
                onClick={() => handleStyleSelect(style.value)}
                onMouseEnter={() => setHoveredStyle(style.value)}
                onMouseLeave={() => setHoveredStyle(null)}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                  selectedStyle === style.value ? 'bg-primary-50 text-primary-700' : 'text-gray-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{style.icon}</span>
                    <div>
                      <div className="font-medium">{style.label}</div>
                      <div className="text-sm text-gray-500">{style.description}</div>
                    </div>
                  </div>
                  {selectedStyle === style.value && (
                    <CheckIcon className="h-5 w-5 text-primary-600" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {selectedStyleData && (
        <p className="text-xs text-gray-500 mt-2 flex items-start space-x-1">
          <InformationCircleIcon className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span>{selectedStyleData.description}</span>
        </p>
      )}
    </div>
  )
}
