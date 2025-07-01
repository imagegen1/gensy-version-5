'use client'

import { useState } from 'react'
import { SparklesIcon, LightBulbIcon } from '@heroicons/react/24/outline'

interface VideoPromptInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

const PROMPT_EXAMPLES = [
  {
    category: 'Nature',
    prompts: [
      'A serene mountain lake at sunrise with mist rising from the water',
      'Ocean waves crashing against rocky cliffs in slow motion',
      'A forest path with sunlight filtering through autumn leaves',
      'Time-lapse of clouds moving over a vast desert landscape'
    ]
  },
  {
    category: 'Urban',
    prompts: [
      'Busy city street at night with neon lights and traffic',
      'Modern skyscrapers reflecting the golden hour sunlight',
      'Rain falling on empty city streets with reflective puddles',
      'Time-lapse of people walking through a bustling marketplace'
    ]
  },
  {
    category: 'Abstract',
    prompts: [
      'Colorful paint mixing and swirling in water',
      'Geometric shapes morphing and transforming smoothly',
      'Particles of light dancing in a dark space',
      'Liquid metal flowing and reshaping continuously'
    ]
  },
  {
    category: 'Animals',
    prompts: [
      'A majestic eagle soaring through mountain peaks',
      'Dolphins jumping out of crystal clear ocean water',
      'A cat gracefully walking along a garden fence',
      'Butterflies flying around blooming flowers in a meadow'
    ]
  }
]

export function VideoPromptInput({
  value,
  onChange,
  placeholder = "Describe the video you want to create...",
  disabled = false
}: VideoPromptInputProps) {
  const [showExamples, setShowExamples] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(0)

  const handleExampleSelect = (prompt: string) => {
    onChange(prompt)
    setShowExamples(false)
  }

  const getCharacterCount = () => {
    return value.length
  }

  const getCharacterCountColor = () => {
    const count = getCharacterCount()
    if (count > 900) return 'text-red-600'
    if (count > 800) return 'text-yellow-600'
    return 'text-gray-500'
  }

  return (
    <div className="space-y-4">
      {/* Main Input */}
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={4}
          maxLength={1000}
          className={`
            w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm 
            focus:ring-2 focus:ring-primary-500 focus:border-primary-500
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            resize-none
          `}
        />
        
        {/* Character Count */}
        <div className={`absolute bottom-2 right-2 text-xs ${getCharacterCountColor()}`}>
          {getCharacterCount()}/1000
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowExamples(!showExamples)}
          disabled={disabled}
          className="flex items-center text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50"
        >
          <LightBulbIcon className="h-4 w-4 mr-1" />
          {showExamples ? 'Hide Examples' : 'Show Examples'}
        </button>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => onChange('')}
            disabled={disabled || !value}
            className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Prompt Examples */}
      {showExamples && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center mb-3">
            <SparklesIcon className="h-4 w-4 text-primary-600 mr-2" />
            <h3 className="text-sm font-medium text-gray-900">Prompt Examples</h3>
          </div>

          {/* Category Tabs */}
          <div className="flex space-x-1 mb-4 bg-white rounded-md p-1">
            {PROMPT_EXAMPLES.map((category, index) => (
              <button
                key={category.category}
                onClick={() => setSelectedCategory(index)}
                className={`
                  flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors
                  ${selectedCategory === index
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                {category.category}
              </button>
            ))}
          </div>

          {/* Example Prompts */}
          <div className="space-y-2">
            {PROMPT_EXAMPLES[selectedCategory].prompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handleExampleSelect(prompt)}
                disabled={disabled}
                className="w-full text-left p-3 bg-white rounded-md border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <p className="text-sm text-gray-700">{prompt}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Prompt Guidelines */}
      <div className="bg-blue-50 rounded-md p-3 border border-blue-200">
        <h4 className="text-sm font-medium text-blue-800 mb-2">✨ Writing Great Video Prompts:</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• <strong>Be specific:</strong> Include details about setting, lighting, and mood</li>
          <li>• <strong>Describe motion:</strong> Mention camera movements, object actions, or transitions</li>
          <li>• <strong>Set the scene:</strong> Specify time of day, weather, or environment</li>
          <li>• <strong>Add style:</strong> Include artistic style, color palette, or visual effects</li>
          <li>• <strong>Keep it focused:</strong> One main subject or action works best for short videos</li>
        </ul>
      </div>
    </div>
  )
}
