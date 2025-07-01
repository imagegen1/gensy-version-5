'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import MasonryMediaGallery from '@/components/gallery/InteractiveMediaGallery'

// Helper function to get proxied video URL
const getProxiedVideoUrl = (generationId: string): string => {
  return `/api/video/proxy?id=${encodeURIComponent(generationId)}`
}

// Helper function to get proxied image URL
const getProxiedImageUrl = (imageId: string): string => {
  return `/api/images/proxy?id=${encodeURIComponent(imageId)}`
}

interface ImageGeneration {
  id: string
  file_path: string
  created_at: string
  generations?: {
    prompt?: string
    parameters?: any
  }
  metadata?: any
}

interface VideoGeneration {
  id: string
  prompt: string
  result_url: string
  status: string
  created_at: string
  completed_at: string
  type: string
  model_used?: string
  credits_used: number
  parameters?: {
    duration?: number
    aspectRatio?: string
    style?: string
    quality?: string
    provider?: string
    resolution?: { width: number; height: number }
    fileSize?: number
  }
  media_files?: Array<{
    id: string
    filename: string
    file_path: string
    file_size: number
    mime_type: string
    width?: number
    height?: number
    video_duration?: number
    thumbnail_url?: string
    is_public: boolean
  }>
}

// Extract aspect ratio from video data
const extractVideoAspectRatio = (video: VideoGeneration): string => {
  // 1. From parameters.aspectRatio (most reliable)
  if (video.parameters?.aspectRatio) {
    return video.parameters.aspectRatio
  }

  // 2. From media_files dimensions
  if (video.media_files?.[0]?.width && video.media_files[0].height) {
    const mediaFile = video.media_files[0]
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b)
    const divisor = gcd(mediaFile.width, mediaFile.height)
    return `${mediaFile.width / divisor}:${mediaFile.height / divisor}`
  }

  // 3. Default fallback to 16:9
  return '16:9'
}

// Extract aspect ratio from image data (assume square for now)
const extractImageAspectRatio = (image: ImageGeneration): string => {
  // Check if metadata has dimensions
  if (image.metadata?.width && image.metadata?.height) {
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b)
    const divisor = gcd(image.metadata.width, image.metadata.height)
    return `${image.metadata.width / divisor}:${image.metadata.height / divisor}`
  }

  // Check generation parameters
  if (image.generations?.parameters?.width && image.generations?.parameters?.height) {
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b)
    const divisor = gcd(image.generations.parameters.width, image.generations.parameters.height)
    return `${image.generations.parameters.width / divisor}:${image.generations.parameters.height / divisor}`
  }

  // Default to square
  return '1:1'
}

export function InteractiveUnifiedGalleryWrapper() {
  const { userId } = useAuth()
  const [images, setImages] = useState<ImageGeneration[]>([])
  const [videos, setVideos] = useState<VideoGeneration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imageCounts, setImageCounts] = useState({ total: 0, images: 0, upscaled: 0 })

  // Load media from APIs
  const loadMedia = async () => {
    if (!userId) return

    setIsLoading(true)
    setError(null)

    try {
      // Construct video API params the same way as the working video gallery
      const videoParams = new URLSearchParams({
        type: 'video',
        status: 'completed',
        limit: '50',
        offset: '0',
        include_count: 'true'
      })

      // Load both images and videos in parallel
      const [imagesResponse, videosResponse] = await Promise.all([
        fetch('/api/user/images'),
        fetch(`/api/generations?${videoParams}`)
      ])

      // Handle images
      let imageData = []
      let counts = { total: 0, images: 0, upscaled: 0 }
      if (imagesResponse.ok) {
        const imagesResult = await imagesResponse.json()
        imageData = imagesResult.images || []
        counts = imagesResult.counts || { total: imageData.length, images: imageData.length, upscaled: 0 }
      } else {
        console.warn('Failed to load images:', imagesResponse.status)
      }

      // Handle videos
      let videoData = []
      if (videosResponse.ok) {
        const videosResult = await videosResponse.json()
        if (videosResult.success) {
          videoData = videosResult.generations || []
        }
      } else {
        console.warn('Failed to load videos:', videosResponse.status)
      }

      setImages(imageData)
      setVideos(videoData)
      setImageCounts(counts)

    } catch (err) {
      console.error('Failed to load media:', err)
      setError(err instanceof Error ? err.message : 'Failed to load media')
    } finally {
      setIsLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    if (userId) {
      loadMedia()
    }
  }, [userId])

  // Convert media to interactive gallery format
  const convertToInteractiveItems = () => {
    const imageItems = images.map((image) => {
      const aspectRatio = extractImageAspectRatio(image)
      const [widthStr, heightStr] = aspectRatio.split(':')
      const width = parseInt(widthStr) || 1
      const height = parseInt(heightStr) || 1
      const aspectRatioNumber = width / height

      return {
        id: image.id,
        type: "image" as const,
        src: getProxiedImageUrl(image.id),
        aspectRatio: aspectRatioNumber,
        user: {
          name: "You",
          avatar: "/api/placeholder/40/40"
        },
        hasError: false
      }
    })

    const videoItems = videos.map((video) => {
      const aspectRatio = extractVideoAspectRatio(video)
      const [widthStr, heightStr] = aspectRatio.split(':')
      const width = parseInt(widthStr) || 16
      const height = parseInt(heightStr) || 9
      const aspectRatioNumber = width / height

      return {
        id: video.id,
        type: "video" as const,
        src: getProxiedVideoUrl(video.id),
        aspectRatio: aspectRatioNumber,
        user: {
          name: "You",
          avatar: "/api/placeholder/40/40"
        },
        hasError: false
      }
    })

    // Combine and sort by creation date (newest first)
    const allItems = [...imageItems, ...videoItems]
    return allItems.sort((a, b) => {
      const aDate = images.find(img => img.id === a.id)?.created_at || 
                   videos.find(vid => vid.id === a.id)?.created_at || ''
      const bDate = images.find(img => img.id === b.id)?.created_at || 
                   videos.find(vid => vid.id === b.id)?.created_at || ''
      return new Date(bDate).getTime() - new Date(aDate).getTime()
    })
  }

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-500">Please sign in to view your gallery</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your gallery...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadMedia}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const totalItems = imageCounts.total + videos.length

  if (totalItems === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No media found</h3>
          <p className="text-gray-600">Generate your first image or video to see it here</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Gallery</h1>
          <p className="text-gray-600">
            {totalItems} item{totalItems !== 1 ? 's' : ''} • {imageCounts.images} generated image{imageCounts.images !== 1 ? 's' : ''} • {imageCounts.upscaled} upscaled image{imageCounts.upscaled !== 1 ? 's' : ''} • {videos.length} video{videos.length !== 1 ? 's' : ''} • Interactive masonry layout
          </p>
        </div>
        
        <MasonryMediaGallery
          items={convertToInteractiveItems()}
        />
      </div>
    </div>
  )
}
