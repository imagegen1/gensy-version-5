'use client'

import { 
  ClockIcon,
  RectangleStackIcon,
  PaintBrushIcon,
  StarIcon,
  CpuChipIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

interface VideoOptions {
  duration: number
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3' | '3:4'
  style: 'realistic' | 'artistic' | 'cartoon' | 'cinematic' | 'documentary'
  quality: 'standard' | 'high' | 'ultra'
  provider: 'google-veo' | 'replicate-wan'
  motionIntensity: 'low' | 'medium' | 'high'
  frameRate: number
}

interface VideoOptionsPanelProps {
  options: VideoOptions
  onChange: (options: Partial<VideoOptions>) => void
  disabled?: boolean
}

const DURATION_OPTIONS = [
  { value: 3, label: '3s', description: 'Quick clip' },
  { value: 4, label: '4s', description: 'Short scene' },
  { value: 5, label: '5s', description: 'Standard' },
  { value: 6, label: '6s', description: 'Extended' },
  { value: 7, label: '7s', description: 'Detailed' },
  { value: 8, label: '8s', description: 'Long form' },
  { value: 9, label: '9s', description: 'Extended' },
  { value: 10, label: '10s', description: 'Maximum' }
]

const ASPECT_RATIO_OPTIONS = [
  { value: '16:9' as const, label: '16:9', description: 'Landscape (YouTube, TV)' },
  { value: '9:16' as const, label: '9:16', description: 'Portrait (TikTok, Stories)' },
  { value: '1:1' as const, label: '1:1', description: 'Square (Instagram)' },
  { value: '4:3' as const, label: '4:3', description: 'Classic TV' },
  { value: '3:4' as const, label: '3:4', description: 'Portrait Photo' }
]

const STYLE_OPTIONS = [
  { 
    value: 'realistic' as const, 
    label: 'Realistic', 
    description: 'Photorealistic, natural',
    icon: '📷'
  },
  { 
    value: 'artistic' as const, 
    label: 'Artistic', 
    description: 'Creative, stylized',
    icon: '🎨'
  },
  { 
    value: 'cartoon' as const, 
    label: 'Cartoon', 
    description: 'Animated, playful',
    icon: '🎭'
  },
  { 
    value: 'cinematic' as const, 
    label: 'Cinematic', 
    description: 'Film-like, dramatic',
    icon: '🎬'
  },
  { 
    value: 'documentary' as const, 
    label: 'Documentary', 
    description: 'Natural, authentic',
    icon: '📹'
  }
]

const QUALITY_OPTIONS = [
  { value: 'standard' as const, label: 'Standard', description: 'Good quality, faster' },
  { value: 'high' as const, label: 'High', description: 'Better quality, slower' },
  { value: 'ultra' as const, label: 'Ultra', description: 'Best quality, slowest' }
]

const PROVIDER_OPTIONS = [
  { 
    value: 'google-veo' as const, 
    label: 'Google Veo', 
    description: 'High-quality, versatile',
    features: ['Best quality', 'Multiple styles', 'Fast processing']
  },
  { 
    value: 'replicate-wan' as const, 
    label: 'Replicate Wan 2.1', 
    description: 'Advanced AI model',
    features: ['Artistic styles', 'Fine control', 'Custom parameters']
  }
]

const MOTION_INTENSITY_OPTIONS = [
  { value: 'low' as const, label: 'Low', description: 'Subtle movement' },
  { value: 'medium' as const, label: 'Medium', description: 'Balanced motion' },
  { value: 'high' as const, label: 'High', description: 'Dynamic action' }
]

const FRAME_RATE_OPTIONS = [
  { value: 24, label: '24 FPS', description: 'Cinematic' },
  { value: 30, label: '30 FPS', description: 'Standard' },
  { value: 60, label: '60 FPS', description: 'Smooth' }
]

export function VideoOptionsPanel({
  options,
  onChange,
  disabled = false
}: VideoOptionsPanelProps) {
  return (
    <div className="space-y-6">
      {/* Duration */}
      <div>
        <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
          <ClockIcon className="h-4 w-4 mr-2" />
          Duration: {options.duration} seconds
        </label>
        <div className="grid grid-cols-4 gap-2">
          {DURATION_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onChange({ duration: option.value })}
              disabled={disabled}
              className={`
                p-3 rounded-lg border-2 text-center transition-all
                ${options.duration === option.value
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="text-sm font-bold">{option.label}</div>
              <div className="text-xs text-gray-500">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Aspect Ratio */}
      <div>
        <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
          <RectangleStackIcon className="h-4 w-4 mr-2" />
          Aspect Ratio
        </label>
        <div className="grid grid-cols-3 gap-2">
          {ASPECT_RATIO_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onChange({ aspectRatio: option.value })}
              disabled={disabled}
              className={`
                p-3 rounded-lg border-2 text-center transition-all
                ${options.aspectRatio === option.value
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="text-sm font-bold">{option.label}</div>
              <div className="text-xs text-gray-500">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Style */}
      <div>
        <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
          <PaintBrushIcon className="h-4 w-4 mr-2" />
          Style
        </label>
        <div className="space-y-2">
          {STYLE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onChange({ style: option.value })}
              disabled={disabled}
              className={`
                w-full p-4 rounded-lg border-2 text-left transition-all
                ${options.style === option.value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{option.icon}</span>
                <div>
                  <div className={`font-medium ${
                    options.style === option.value ? 'text-primary-700' : 'text-gray-900'
                  }`}>
                    {option.label}
                  </div>
                  <div className={`text-sm ${
                    options.style === option.value ? 'text-primary-600' : 'text-gray-500'
                  }`}>
                    {option.description}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Provider */}
      <div>
        <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
          <CpuChipIcon className="h-4 w-4 mr-2" />
          AI Provider
        </label>
        <div className="space-y-2">
          {PROVIDER_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onChange({ provider: option.value })}
              disabled={disabled}
              className={`
                w-full p-4 rounded-lg border-2 text-left transition-all
                ${options.provider === option.value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className={`font-medium ${
                    options.provider === option.value ? 'text-primary-700' : 'text-gray-900'
                  }`}>
                    {option.label}
                  </div>
                  <div className={`text-sm ${
                    options.provider === option.value ? 'text-primary-600' : 'text-gray-500'
                  }`}>
                    {option.description}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {option.features.map((feature, index) => (
                      <span
                        key={index}
                        className={`text-xs px-2 py-1 rounded-full ${
                          options.provider === option.value
                            ? 'bg-primary-100 text-primary-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
                {options.provider === option.value && (
                  <div className="w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Quality */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <StarIcon className="h-4 w-4 mr-1" />
            Quality
          </label>
          <select
            value={options.quality}
            onChange={(e) => onChange({ quality: e.target.value as any })}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
          >
            {QUALITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} - {option.description}
              </option>
            ))}
          </select>
        </div>

        {/* Motion Intensity */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <ArrowPathIcon className="h-4 w-4 mr-1" />
            Motion
          </label>
          <select
            value={options.motionIntensity}
            onChange={(e) => onChange({ motionIntensity: e.target.value as any })}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
          >
            {MOTION_INTENSITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} - {option.description}
              </option>
            ))}
          </select>
        </div>

        {/* Frame Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Frame Rate
          </label>
          <select
            value={options.frameRate}
            onChange={(e) => onChange({ frameRate: parseInt(e.target.value) })}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
          >
            {FRAME_RATE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} - {option.description}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
