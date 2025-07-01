'use client'

import { SparklesIcon } from '@heroicons/react/24/outline'

interface EnhancementSelectorProps {
  value: 'none' | 'denoise' | 'sharpen' | 'colorize' | 'ai-enhanced'
  onChange: (enhancement: 'none' | 'denoise' | 'sharpen' | 'colorize' | 'ai-enhanced') => void
  disabled?: boolean
}

const ENHANCEMENT_OPTIONS = [
  {
    value: 'none' as const,
    label: 'None',
    description: 'Basic upscaling only',
    icon: '🔧',
    credits: 0
  },
  {
    value: 'denoise' as const,
    label: 'Denoise',
    description: 'Remove noise and grain',
    icon: '🧹',
    credits: 0
  },
  {
    value: 'sharpen' as const,
    label: 'Sharpen',
    description: 'Enhance edge definition',
    icon: '🔍',
    credits: 0
  },
  {
    value: 'colorize' as const,
    label: 'Colorize',
    description: 'Enhance colors and contrast',
    icon: '🎨',
    credits: 0
  },
  {
    value: 'ai-enhanced' as const,
    label: 'AI Enhanced',
    description: 'AI-powered enhancement',
    icon: '🤖',
    credits: 1
  },
]

export function EnhancementSelector({
  value,
  onChange,
  disabled = false
}: EnhancementSelectorProps) {
  const selectedOption = ENHANCEMENT_OPTIONS.find(option => option.value === value)

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        <SparklesIcon className="h-4 w-4 inline mr-1" />
        Enhancement Type
      </label>
      
      <div className="space-y-2">
        {ENHANCEMENT_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            disabled={disabled}
            className={`
              w-full p-4 rounded-lg border-2 text-left transition-all
              ${value === option.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{option.icon}</span>
                <div>
                  <div className={`font-medium ${
                    value === option.value ? 'text-blue-700' : 'text-gray-900'
                  }`}>
                    {option.label}
                    {option.credits > 0 && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        +{option.credits} credit
                      </span>
                    )}
                  </div>
                  <div className={`text-sm ${
                    value === option.value ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {option.description}
                  </div>
                </div>
              </div>
              
              {value === option.value && (
                <div className="w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Enhancement Info */}
      {selectedOption && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">
              {selectedOption.icon} {selectedOption.label} Enhancement
            </p>
            <p className="text-blue-700">{selectedOption.description}</p>
            
            {selectedOption.value === 'denoise' && (
              <p className="text-xs text-blue-600 mt-2">
                Best for: Old photos, scanned images, low-light photography
              </p>
            )}
            
            {selectedOption.value === 'sharpen' && (
              <p className="text-xs text-blue-600 mt-2">
                Best for: Blurry images, soft focus photos, text documents
              </p>
            )}
            
            {selectedOption.value === 'colorize' && (
              <p className="text-xs text-blue-600 mt-2">
                Best for: Faded photos, low contrast images, vintage pictures
              </p>
            )}
            
            {selectedOption.value === 'ai-enhanced' && (
              <p className="text-xs text-blue-600 mt-2">
                Best for: Complex images requiring multiple enhancements
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
