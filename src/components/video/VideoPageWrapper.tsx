'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { EnhancedVideoGenerationInterface } from './EnhancedVideoGenerationInterface'

interface PreloadedImageData {
  url: string
  prompt: string
  style: string
  aspectRatio: string
  model: string
  quality: string
  createdAt: string
}

export function VideoPageWrapper() {
  const searchParams = useSearchParams()
  const [preloadedImageData, setPreloadedImageData] = useState<PreloadedImageData | null>(null)

  useEffect(() => {
    const fromImage = searchParams.get('fromImage')
    if (fromImage === 'true') {
      const imageDataStr = localStorage.getItem('videoGenerationImageData')
      if (imageDataStr) {
        try {
          const imageData = JSON.parse(imageDataStr)
          setPreloadedImageData(imageData)
          
          // Clear the localStorage data after using it
          localStorage.removeItem('videoGenerationImageData')
        } catch (error) {
          console.error('Failed to parse image data:', error)
        }
      }
    }
  }, [searchParams])

  return <EnhancedVideoGenerationInterface preloadedImageData={preloadedImageData} />
}
