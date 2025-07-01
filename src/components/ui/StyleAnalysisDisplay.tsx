'use client'

import React from 'react'
import {
  SparklesIcon,
  EyeIcon,
  SwatchIcon,
  LightBulbIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { StyleAnalysisResult, StyleSuggestion } from '@/services/StyleAnalysisService'
import { DEFAULT_STYLES } from './StyleSelector'

interface StyleAnalysisDisplayProps {
  analysisResult: StyleAnalysisResult | null
  isAnalyzing: boolean
  onStyleSelect: (style: string) => void
  selectedStyle: string
  className?: string
}

export function StyleAnalysisDisplay({
  analysisResult,
  isAnalyzing,
  onStyleSelect,
  selectedStyle,
  className = ''
}: StyleAnalysisDisplayProps) {
  if (isAnalyzing) {
    return (
      <div className={`bg-gradient-to-r from-primary-50 to-purple-50 rounded-lg p-6 border border-primary-200 ${className}`}>
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <SparklesIcon className="w-5 h-5 text-primary-600 animate-pulse" />
          </div>
          <div>
            <h3 className="font-semibold text-primary-900">Analyzing Style...</h3>
            <p className="text-sm text-primary-700">Detecting visual characteristics and artistic elements</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-sm text-primary-600">
            <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse"></div>
            <span>Analyzing color palette and saturation</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-primary-600">
            <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <span>Detecting texture complexity and detail level</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-primary-600">
            <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            <span>Evaluating composition and artistic elements</span>
          </div>
        </div>
      </div>
    )
  }

  if (!analysisResult) {
    return null
  }

  const getStyleData = (styleName: string) => {
    return DEFAULT_STYLES.find(s => s.value === styleName)
  }

  const formatConfidence = (confidence: number) => {
    return Math.round(confidence * 100)
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100'
    if (confidence >= 0.6) return 'text-blue-600 bg-blue-100'
    if (confidence >= 0.4) return 'text-yellow-600 bg-yellow-100'
    return 'text-gray-600 bg-gray-100'
  }

  return (
    <div className={`bg-gradient-to-r from-primary-50 to-purple-50 rounded-lg p-6 border border-primary-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <SparklesIcon className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-primary-900">Style Analysis Complete</h3>
            <p className="text-sm text-primary-700">
              {formatConfidence(analysisResult.confidence)}% confidence • {analysisResult.processingTime}ms
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1 text-xs text-primary-600">
          <ClockIcon className="w-4 h-4" />
          <span>Just now</span>
        </div>
      </div>

      {/* Style Suggestions */}
      <div className="space-y-4 mb-6">
        <h4 className="font-medium text-primary-900 flex items-center space-x-2">
          <LightBulbIcon className="w-4 h-4" />
          <span>Recommended Styles</span>
        </h4>
        
        <div className="grid gap-3">
          {analysisResult.suggestedStyles.map((suggestion, index) => {
            const styleData = getStyleData(suggestion.style)
            const isSelected = selectedStyle === suggestion.style
            const confidenceColor = getConfidenceColor(suggestion.confidence)
            
            return (
              <div
                key={suggestion.style}
                className={`relative p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer group ${
                  isSelected
                    ? 'border-primary-500 bg-primary-100 shadow-md'
                    : 'border-primary-200 bg-white hover:border-primary-300 hover:shadow-sm'
                }`}
                onClick={() => onStyleSelect(suggestion.style)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {/* Style Icon and Info */}
                    <div className="flex-shrink-0">
                      <div className="text-2xl">{styleData?.icon || '🎨'}</div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h5 className="font-medium text-gray-900">{styleData?.label || suggestion.style}</h5>
                        {index === 0 && (
                          <span className="bg-primary-500 text-white text-xs px-2 py-1 rounded-full">
                            Best Match
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{styleData?.description}</p>
                      
                      {/* Reasoning */}
                      <div className="space-y-1">
                        {suggestion.reasoning.slice(0, 2).map((reason, idx) => (
                          <div key={idx} className="flex items-start space-x-2 text-xs text-gray-500">
                            <div className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 flex-shrink-0"></div>
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>
                      
                      {/* Characteristics */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {suggestion.characteristics.map((char, idx) => (
                          <span
                            key={idx}
                            className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full"
                          >
                            {char}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Confidence Score */}
                  <div className="flex flex-col items-end space-y-2">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${confidenceColor}`}>
                      {formatConfidence(suggestion.confidence)}%
                    </div>
                    
                    {isSelected && (
                      <CheckCircleIcon className="w-5 h-5 text-primary-600" />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Image Characteristics */}
      <div className="border-t border-primary-200 pt-4">
        <h4 className="font-medium text-primary-900 flex items-center space-x-2 mb-3">
          <EyeIcon className="w-4 h-4" />
          <span>Detected Characteristics</span>
        </h4>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Color Analysis */}
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-gray-700 flex items-center space-x-1">
              <SwatchIcon className="w-3 h-3" />
              <span>Colors</span>
            </h5>
            <div className="flex space-x-1">
              {analysisResult.imageCharacteristics.dominantColors.slice(0, 5).map((color, idx) => (
                <div
                  key={idx}
                  className="w-6 h-6 rounded-full border border-gray-200 flex-shrink-0"
                  style={{ backgroundColor: color.hex }}
                  title={`${color.name} (${Math.round(color.percentage)}%)`}
                />
              ))}
            </div>
          </div>
          
          {/* Technical Details */}
          <div className="space-y-1">
            <h5 className="text-sm font-medium text-gray-700">Technical</h5>
            <div className="text-xs text-gray-600 space-y-0.5">
              <div>Brightness: {Math.round(analysisResult.imageCharacteristics.brightness * 100)}%</div>
              <div>Saturation: {Math.round(analysisResult.imageCharacteristics.saturation * 100)}%</div>
              <div>Complexity: {analysisResult.imageCharacteristics.textureComplexity}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Hint */}
      <div className="mt-4 p-3 bg-primary-100 rounded-lg">
        <p className="text-xs text-primary-700 text-center">
          💡 Click on a suggested style above to apply it, or choose manually from the style selector
        </p>
      </div>
    </div>
  )
}
