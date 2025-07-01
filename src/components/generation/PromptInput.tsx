'use client'

import { useState } from 'react'
import { 
  SparklesIcon, 
  LightBulbIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline'

interface PromptInputProps {
  prompt: string
  onPromptChange: (prompt: string) => void
  negativePrompt: string
  onNegativePromptChange: (negativePrompt: string) => void
  disabled?: boolean
}

const PROMPT_SUGGESTIONS = [
  "A majestic mountain landscape at sunset with golden light",
  "A futuristic city with flying cars and neon lights",
  "A cozy coffee shop with warm lighting and vintage furniture",
  "A magical forest with glowing mushrooms and fairy lights",
  "A minimalist modern living room with natural light",
  "A steampunk airship floating above clouds",
  "A serene Japanese garden with cherry blossoms",
  "A cyberpunk street scene with rain and neon reflections"
]

const NEGATIVE_PROMPT_SUGGESTIONS = [
  "blurry, low quality, distorted",
  "text, watermark, signature",
  "extra limbs, deformed hands",
  "dark, gloomy, depressing",
  "cartoon, anime, illustration",
  "black and white, monochrome"
]

export function PromptInput({
  prompt,
  onPromptChange,
  negativePrompt,
  onNegativePromptChange,
  disabled = false
}: PromptInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showNegativeSuggestions, setShowNegativeSuggestions] = useState(false)

  const handleSuggestionClick = (suggestion: string) => {
    onPromptChange(suggestion)
    setShowSuggestions(false)
  }

  const handleNegativeSuggestionClick = (suggestion: string) => {
    onNegativePromptChange(suggestion)
    setShowNegativeSuggestions(false)
  }

  const enhancePrompt = async () => {
    if (!prompt.trim()) return

    try {
      const response = await fetch('/api/generate/enhance-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.enhancedPrompt) {
          onPromptChange(data.enhancedPrompt)
        }
      }
    } catch (error) {
      console.error('Failed to enhance prompt:', error)
    }
  }

  return (
    <div className="space-y-4">
      {/* Main Prompt Input */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">
            Describe your image
          </label>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="text-xs text-primary-600 hover:text-primary-700 flex items-center"
            >
              <LightBulbIcon className="h-3 w-3 mr-1" />
              Ideas
            </button>
            <button
              type="button"
              onClick={enhancePrompt}
              disabled={!prompt.trim() || disabled}
              className="text-xs text-primary-600 hover:text-primary-700 flex items-center disabled:opacity-50"
            >
              <SparklesIcon className="h-3 w-3 mr-1" />
              Enhance
            </button>
          </div>
        </div>
        
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          disabled={disabled}
          placeholder="A beautiful landscape with mountains and a lake at sunset..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
          rows={3}
          maxLength={1000}
        />
        
        {/* Prompt Suggestions */}
        {showSuggestions && (
          <div className="mt-2 p-3 bg-gray-50 rounded-md border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">Prompt Ideas</h4>
              <button
                onClick={() => setShowSuggestions(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {PROMPT_SUGGESTIONS.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-left text-sm text-gray-600 hover:text-primary-600 hover:bg-white p-2 rounded border border-transparent hover:border-primary-200 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Negative Prompt Input */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="negative-prompt" className="block text-sm font-medium text-gray-700">
            Negative prompt (optional)
          </label>
          <button
            type="button"
            onClick={() => setShowNegativeSuggestions(!showNegativeSuggestions)}
            className="text-xs text-primary-600 hover:text-primary-700 flex items-center"
          >
            <LightBulbIcon className="h-3 w-3 mr-1" />
            Examples
          </button>
        </div>
        
        <textarea
          id="negative-prompt"
          value={negativePrompt}
          onChange={(e) => onNegativePromptChange(e.target.value)}
          disabled={disabled}
          placeholder="What you don't want in the image (e.g., blurry, low quality, text...)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
          rows={2}
          maxLength={500}
        />
        
        {/* Negative Prompt Suggestions */}
        {showNegativeSuggestions && (
          <div className="mt-2 p-3 bg-gray-50 rounded-md border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">Common Negative Prompts</h4>
              <button
                onClick={() => setShowNegativeSuggestions(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {NEGATIVE_PROMPT_SUGGESTIONS.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleNegativeSuggestionClick(suggestion)}
                  className="text-left text-sm text-gray-600 hover:text-primary-600 hover:bg-white p-2 rounded border border-transparent hover:border-primary-200 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Character Counts */}
      <div className="flex justify-between text-xs text-gray-500">
        <span>Prompt: {prompt.length}/1000</span>
        <span>Negative: {negativePrompt.length}/500</span>
      </div>
    </div>
  )
}
