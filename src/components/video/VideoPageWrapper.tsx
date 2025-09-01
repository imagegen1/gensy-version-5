'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
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

function VideoPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
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

      // Clean up the URL parameter after processing
      router.replace('/video', { scroll: false })
    }
  }, [searchParams, router])

  return <EnhancedVideoGenerationInterface preloadedImageData={preloadedImageData} />
}

export function VideoPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading video generation interface...</p>
        </div>
      </div>
    }>
      <VideoPageContent />
    </Suspense>
  )
}
