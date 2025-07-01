'use client'

import { useState } from 'react'
import {
  RectangleStackIcon,
  PaintBrushIcon,
  SparklesIcon,
  AdjustmentsHorizontalIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline'
import { StyleSelector } from '@/components/ui/StyleSelector'

interface GenerationOptionsProps {
  options: {
    aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'
    style: 'realistic' | 'artistic' | 'cartoon' | 'abstract' | 'photographic'
    quality: 'standard' | 'high' | 'ultra'
    guidanceScale: number
  }
  onOptionsChange: (options: any) => void
  disabled?: boolean
}

const ASPECT_RATIOS = [
  { value: '1:1', label: 'Square (1:1)', description: 'Perfect for social media' },
  { value: '16:9', label: 'Landscape (16:9)', description: 'Great for wallpapers' },
  { value: '9:16', label: 'Portrait (9:16)', description: 'Ideal for mobile screens' },
  { value: '4:3', label: 'Standard (4:3)', description: 'Classic photo format' },
  { value: '3:4', label: 'Portrait (3:4)', description: 'Traditional portrait' },
] as const

const STYLES = [
  { 
    value: 'realistic', 
    label: 'Realistic', 
    description: 'Photorealistic images',
    icon: '📸'
  },
  { 
    value: 'artistic', 
    label: 'Artistic', 
    description: 'Painterly and creative',
    icon: '🎨'
  },
  { 
    value: 'cartoon', 
    label: 'Cartoon', 
    description: 'Animated and stylized',
    icon: '🎭'
  },
  { 
    value: 'abstract', 
    label: 'Abstract', 
    description: 'Non-representational art',
    icon: '🌀'
  },
  { 
    value: 'photographic', 
    label: 'Photographic', 
    description: 'Camera-like quality',
    icon: '📷'
  },
] as const

const QUALITY_OPTIONS = [
  { 
    value: 'standard', 
    label: 'Standard', 
    description: '1 credit • Fast generation',
    credits: 1
  },
  { 
    value: 'high', 
    label: 'High', 
    description: '1 credit • Better quality',
    credits: 1
  },
  { 
    value: 'ultra', 
    label: 'Ultra', 
    description: '3 credits • Premium quality',
    credits: 3
  },
] as const

export function GenerationOptions({
  options,
  onOptionsChange,
  disabled = false
}: GenerationOptionsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const updateOption = (key: string, value: any) => {
    onOptionsChange({
      ...options,
      [key]: value
    })
  }

  return (
    <div className="space-y-4">
      {/* Basic Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Aspect Ratio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <RectangleStackIcon className="h-4 w-4 inline mr-1" />
            Aspect Ratio
          </label>
          <select
            value={options.aspectRatio}
            onChange={(e) => updateOption('aspectRatio', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
          >
            {ASPECT_RATIOS.map((ratio) => (
              <option key={ratio.value} value={ratio.value}>
                {ratio.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {ASPECT_RATIOS.find(r => r.value === options.aspectRatio)?.description}
          </p>
        </div>

        {/* Style */}
        <div>
          <StyleSelector
            selectedStyle={options.style}
            onStyleChange={(style) => updateOption('style', style)}
            disabled={disabled}
            variant="dropdown"
            showTooltips={true}
          />
        </div>

        {/* Quality */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <SparklesIcon className="h-4 w-4 inline mr-1" />
            Quality
          </label>
          <select
            value={options.quality}
            onChange={(e) => updateOption('quality', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
          >
            {QUALITY_OPTIONS.map((quality) => (
              <option key={quality.value} value={quality.value}>
                {quality.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {QUALITY_OPTIONS.find(q => q.value === options.quality)?.description}
          </p>
        </div>
      </div>

      {/* Advanced Options Toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center text-sm text-primary-600 hover:text-primary-700"
        >
          <AdjustmentsHorizontalIcon className="h-4 w-4 mr-1" />
          Advanced Options
          {showAdvanced ? (
            <ChevronUpIcon className="h-4 w-4 ml-1" />
          ) : (
            <ChevronDownIcon className="h-4 w-4 ml-1" />
          )}
        </button>
      </div>

      {/* Advanced Options */}
      {showAdvanced && (
        <div className="bg-gray-50 rounded-md p-4 space-y-4">
          {/* Guidance Scale */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Guidance Scale: {options.guidanceScale}
            </label>
            <input
              type="range"
              min="1"
              max="20"
              step="0.5"
              value={options.guidanceScale}
              onChange={(e) => updateOption('guidanceScale', parseFloat(e.target.value))}
              disabled={disabled}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1 (Creative)</span>
              <span>10 (Balanced)</span>
              <span>20 (Precise)</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Higher values follow the prompt more closely, lower values allow more creativity
            </p>
          </div>

          {/* Style Presets */}
          <div>
            <StyleSelector
              selectedStyle={options.style}
              onStyleChange={(style) => updateOption('style', style)}
              disabled={disabled}
              variant="grid"
              showTooltips={true}
            />
          </div>

          {/* Aspect Ratio Visual */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Aspect Ratio Preview
            </label>
            <div className="grid grid-cols-5 gap-2">
              {ASPECT_RATIOS.map((ratio) => {
                const [width, height] = ratio.value.split(':').map(Number)
                const aspectRatio = width / height
                const maxWidth = 60
                const maxHeight = 60
                
                let displayWidth, displayHeight
                if (aspectRatio > 1) {
                  displayWidth = maxWidth
                  displayHeight = maxWidth / aspectRatio
                } else {
                  displayHeight = maxHeight
                  displayWidth = maxHeight * aspectRatio
                }

                return (
                  <button
                    key={ratio.value}
                    onClick={() => updateOption('aspectRatio', ratio.value)}
                    disabled={disabled}
                    className={`p-2 rounded-md border text-center transition-colors ${
                      options.aspectRatio === ratio.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    } disabled:opacity-50`}
                  >
                    <div className="flex items-center justify-center mb-1">
                      <div
                        className={`border-2 ${
                          options.aspectRatio === ratio.value
                            ? 'border-primary-500'
                            : 'border-gray-300'
                        }`}
                        style={{
                          width: `${displayWidth}px`,
                          height: `${displayHeight}px`,
                        }}
                      />
                    </div>
                    <div className="text-xs font-medium">{ratio.value}</div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
