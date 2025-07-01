'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import MasonryMediaGallery from '@/components/gallery/InteractiveMediaGallery'

// Helper function to get proxied video URL
const getProxiedVideoUrl = (generationId: string): string => {
  return `/api/video/proxy?id=${encodeURIComponent(generationId)}`
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
const extractAspectRatio = (video: VideoGeneration): string => {
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

export function InteractiveVideoGalleryWrapper() {
  const { userId } = useAuth()
  const [videos, setVideos] = useState<VideoGeneration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load videos from API
  const loadVideos = async () => {
    if (!userId) return

    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        type: 'video',
        status: 'completed',
        limit: '50',
        offset: '0',
        include_count: 'true'
      })

      const response = await fetch(`/api/generations?${params}`)
      
      if (!response.ok) {
        throw new Error(`Failed to load videos: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to load videos')
      }

      const videoGenerations = data.generations || []
      setVideos(videoGenerations)

    } catch (err) {
      console.error('Failed to load videos:', err)
      setError(err instanceof Error ? err.message : 'Failed to load videos')
    } finally {
      setIsLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    if (userId) {
      loadVideos()
    }
  }, [userId])

  // Convert videos to interactive gallery format
  const convertToInteractiveItems = (videos: VideoGeneration[]) => {
    return videos.map((video) => {
      const aspectRatio = extractAspectRatio(video)
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
  }

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-500">Please sign in to view your videos</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your video gallery...</p>
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
            onClick={loadVideos}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No videos found</h3>
          <p className="text-gray-600">Generate your first video to see it here</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Video Gallery</h1>
          <p className="text-gray-600">
            {videos.length} video{videos.length !== 1 ? 's' : ''} • Interactive masonry layout
          </p>
        </div>
        
        <MasonryMediaGallery
          items={convertToInteractiveItems(videos)}
        />
      </div>
    </div>
  )
}
