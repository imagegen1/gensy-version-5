'use client'

import { ArrowsPointingOutIcon } from '@heroicons/react/24/outline'

interface ScaleFactorSelectorProps {
  value: number
  onChange: (scaleFactor: number) => void
  disabled?: boolean
}

const SCALE_FACTORS = [
  { value: 1.5, label: '1.5x', description: 'Subtle enhancement' },
  { value: 2, label: '2x', description: 'Standard upscaling' },
  { value: 3, label: '3x', description: 'High quality boost' },
  { value: 4, label: '4x', description: 'Maximum detail' },
  { value: 6, label: '6x', description: 'Ultra enhancement' },
  { value: 8, label: '8x', description: 'Extreme upscaling' },
]

export function ScaleFactorSelector({
  value,
  onChange,
  disabled = false
}: ScaleFactorSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        <ArrowsPointingOutIcon className="h-4 w-4 inline mr-1" />
        Scale Factor
      </label>
      
      <div className="grid grid-cols-3 gap-3">
        {SCALE_FACTORS.map((factor) => (
          <button
            key={factor.value}
            onClick={() => onChange(factor.value)}
            disabled={disabled}
            className={`
              p-4 rounded-lg border-2 text-center transition-all
              ${value === factor.value
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="text-lg font-bold mb-1">{factor.label}</div>
            <div className="text-xs text-gray-500">{factor.description}</div>
          </button>
        ))}
      </div>

      {/* Custom Scale Factor */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Custom Scale Factor: {value}x
        </label>
        <input
          type="range"
          min="1.5"
          max="8"
          step="0.5"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>1.5x</span>
          <span>4x</span>
          <span>8x</span>
        </div>
      </div>

      {/* Scale Factor Info */}
      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">Scale Factor Guidelines:</p>
          <ul className="space-y-1 text-xs">
            <li>• <strong>1.5x-2x:</strong> Best for photos and natural images</li>
            <li>• <strong>3x-4x:</strong> Good for artwork and illustrations</li>
            <li>• <strong>6x-8x:</strong> Use with caution, may introduce artifacts</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
