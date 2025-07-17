'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@clerk/nextjs'
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui"
import { Play, Pause, Volume2, Volume1, VolumeX, X } from "lucide-react"
import { cn } from "@/lib/utils"
import MasonryMediaGallery from "@/components/gallery/InteractiveMediaGallery"
import {
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
  VideoCameraIcon,
  CalendarIcon,
  ClockIcon,
  TagIcon,
} from '@heroicons/react/24/outline'

// Helper function to get proxied video URL
const getProxiedVideoUrl = (generationId: string): string => {
  const isTestMode = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_TEST_MODE === 'true'
  const testModeParam = isTestMode ? '&testMode=true' : ''
  return `/api/video/proxy?id=${encodeURIComponent(generationId)}${testModeParam}`
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

interface EnhancedVideoGalleryProps {
  className?: string
  showHeader?: boolean
  maxItems?: number
  onVideoSelect?: (video: VideoGeneration) => void
  enableSelection?: boolean
  viewMode?: 'grid' | 'list' | 'interactive' | 'masonry'
}

type SortBy = 'newest' | 'oldest' | 'duration' | 'credits'
type FilterBy = 'all' | 'completed' | 'processing' | 'failed'

// Enhanced media item interface for interactive gallery
interface MediaItem {
  id: string
  type: "video"
  src: string
  aspectRatio: number
  title: string
  description: string
  user: {
    name: string
    avatar: string
  }
  duration: number
  createdAt: string
  style?: string
  credits: number
  span?: string // For bento layout
}

// Format time utility
const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

// Custom slider component for video controls
const CustomSlider = ({
  value,
  onChange,
  className,
}: {
  value: number
  onChange: (value: number) => void
  className?: string
}) => {
  return (
    <motion.div
      className={cn(
        "relative w-full h-1 bg-white/20 rounded-full cursor-pointer",
        className
      )}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const percentage = (x / rect.width) * 100
        onChange(Math.min(Math.max(percentage, 0), 100))
      }}
    >
      <motion.div
        className="absolute top-0 left-0 h-full bg-white rounded-full"
        style={{ width: `${value}%` }}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
    </motion.div>
  )
}

// Simplified aspect ratio span calculation for bento layout
const getAspectRatioSpanClass = (aspectRatio: string): string => {
  const [widthStr, heightStr] = aspectRatio.split(':').map(s => s.trim())
  const width = parseInt(widthStr) || 16
  const height = parseInt(heightStr) || 9
  const ratio = width / height

  // Only two configurations:
  if (ratio < 1.0) {
    return 'col-span-1 row-span-2' // Portrait
  } else {
    return 'col-span-2 row-span-1' // Landscape (default)
  }
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

export function EnhancedVideoGallery({
  className = '',
  showHeader = true,
  maxItems,
  onVideoSelect,
  enableSelection = false,
  viewMode: initialViewMode = 'interactive'
}: EnhancedVideoGalleryProps) {
  const { userId } = useAuth()
  const [videos, setVideos] = useState<VideoGeneration[]>([])
  const [filteredVideos, setFilteredVideos] = useState<VideoGeneration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  
  // UI State
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'interactive' | 'masonry'>(initialViewMode)
  const [sortBy, setSortBy] = useState<SortBy>('newest')
  const [filterBy, setFilterBy] = useState<FilterBy>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set())
  const [selectedVideo, setSelectedVideo] = useState<VideoGeneration | null>(null)
  
  // Refs
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Load videos from API
  const loadVideos = useCallback(async (reset = false) => {
    if (!userId) return

    const currentOffset = reset ? 0 : offset
    const isInitialLoad = reset || currentOffset === 0

    if (isInitialLoad) {
      setIsLoading(true)
      setError(null)
    } else {
      setIsLoadingMore(true)
    }

    try {
      const params = new URLSearchParams({
        type: 'video',
        status: filterBy === 'all' ? '' : filterBy,
        limit: '20',
        offset: currentOffset.toString(),
        include_count: 'true'
      })

      // Remove empty parameters
      if (!params.get('status')) {
        params.delete('status')
      }

      const response = await fetch(`/api/generations?${params}`)
      
      if (!response.ok) {
        throw new Error(`Failed to load videos: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to load videos')
      }

      const newVideos = data.generations || []
      const pagination = data.pagination || {}

      if (isInitialLoad) {
        setVideos(newVideos)
        setOffset(newVideos.length)
      } else {
        setVideos(prev => [...prev, ...newVideos])
        setOffset(prev => prev + newVideos.length)
      }

      setHasMore(pagination.hasMore || false)

    } catch (err) {
      console.error('Failed to load videos:', err)
      setError(err instanceof Error ? err.message : 'Failed to load videos')
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [userId, offset, filterBy])

  // Initial load
  useEffect(() => {
    if (userId) {
      loadVideos(true)
    }
  }, [userId, filterBy])

  // Filter and sort videos
  useEffect(() => {
    let filtered = [...videos]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(video =>
        video.prompt.toLowerCase().includes(query) ||
        video.parameters?.style?.toLowerCase().includes(query) ||
        video.model_used?.toLowerCase().includes(query)
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'duration':
          const aDuration = a.parameters?.duration || 0
          const bDuration = b.parameters?.duration || 0
          return bDuration - aDuration
        case 'credits':
          return b.credits_used - a.credits_used
        default:
          return 0
      }
    })

    // Apply max items limit
    if (maxItems) {
      filtered = filtered.slice(0, maxItems)
    }

    setFilteredVideos(filtered)
  }, [videos, searchQuery, sortBy, maxItems])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!hasMore || isLoadingMore) return

    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadVideos(false)
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, isLoadingMore, loadVideos])

  // Convert videos to media items for interactive gallery
  const convertToMediaItems = (videos: VideoGeneration[]): MediaItem[] => {
    return videos.map((video) => {
      const aspectRatio = extractAspectRatio(video)
      const spanClass = getAspectRatioSpanClass(aspectRatio)
      const [widthStr, heightStr] = aspectRatio.split(':')
      const width = parseInt(widthStr) || 16
      const height = parseInt(heightStr) || 9
      const aspectRatioNumber = width / height

      return {
        id: video.id,
        type: "video" as const,
        src: getProxiedVideoUrl(video.id),
        aspectRatio: aspectRatioNumber,
        title: video.prompt.length > 60 ? video.prompt.substring(0, 60) + '...' : video.prompt,
        description: `${video.parameters?.style || 'Unknown style'} • ${aspectRatio} • ${video.parameters?.duration || 5}s`,
        user: {
          name: "You", // Since this is user's own videos
          avatar: "/api/placeholder/40/40" // Placeholder avatar
        },
        duration: video.parameters?.duration || video.media_files?.[0]?.video_duration || 5,
        createdAt: video.created_at,
        style: video.parameters?.style,
        credits: video.credits_used,
        span: spanClass
      }
    })
  }

  // Convert videos to masonry gallery format
  const convertToMasonryItems = (videos: VideoGeneration[]) => {
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
        }
      }
    })
  }

  // Handle video selection
  const handleVideoClick = (video: VideoGeneration) => {
    if (viewMode === 'interactive') {
      setSelectedVideo(video)
      return
    }

    if (enableSelection) {
      const newSelected = new Set(selectedVideos)
      if (newSelected.has(video.id)) {
        newSelected.delete(video.id)
      } else {
        newSelected.add(video.id)
      }
      setSelectedVideos(newSelected)
    }

    onVideoSelect?.(video)
  }

  // Handle interactive gallery item click
  const handleInteractiveItemClick = (item: MediaItem) => {
    const video = filteredVideos.find(v => v.id === item.id)
    if (video) {
      setSelectedVideo(video)
    }
  }

  // Format duration
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}d ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  // Get aspect ratio classes for responsive design
  const getAspectRatioClasses = (aspectRatio?: string) => {
    switch (aspectRatio) {
      case '16:9':
        return 'aspect-video' // 16:9
      case '9:16':
        return 'aspect-[9/16]' // 9:16 (vertical)
      case '1:1':
        return 'aspect-square' // 1:1
      default:
        return 'aspect-video' // Default to 16:9
    }
  }

  if (!userId) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <VideoCameraIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Please sign in to view your videos</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      {showHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Video Gallery</h1>
            <p className="text-gray-600">
              {filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''}
              {selectedVideos.size > 0 && ` • ${selectedVideos.size} selected`}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadVideos(true)}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as FilterBy)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="duration">By Duration</option>
            <option value="credits">By Credits</option>
          </select>

          {/* View Mode */}
          <div className="flex border border-gray-300 rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode('interactive')}
              className={`p-2 ${viewMode === 'interactive' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              title="Interactive Bento Gallery"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              title="Grid View"
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              title="List View"
            >
              <ListBulletIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('masonry')}
              className={`p-2 ${viewMode === 'masonry' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              title="Masonry Gallery"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 3a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V3zM3 9a1 1 0 011-1h3a1 1 0 011 1v7a1 1 0 01-1 1H4a1 1 0 01-1-1V9zM10 3a1 1 0 011-1h3a1 1 0 011 1v7a1 1 0 01-1 1h-3a1 1 0 01-1-1V3zM10 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {error ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => loadVideos(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading videos...</p>
          </div>
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <VideoCameraIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No videos found</p>
            <p className="text-sm text-gray-400">
              {searchQuery ? 'Try adjusting your search terms' : 'Generate your first video to get started'}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Interactive Gallery */}
          {viewMode === 'interactive' ? (
            <InteractiveVideoGallery
              mediaItems={convertToMediaItems(filteredVideos)}
              onItemClick={handleInteractiveItemClick}
            />
          ) : viewMode === 'masonry' ? (
            <MasonryMediaGallery
              items={convertToMasonryItems(filteredVideos)}
            />
          ) : (
            /* Video Grid/List */
            <div className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
            }>
              {filteredVideos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  viewMode={viewMode}
                  isSelected={selectedVideos.has(video.id)}
                  onClick={() => handleVideoClick(video)}
                  enableSelection={enableSelection}
                  formatDuration={formatDuration}
                  formatDate={formatDate}
                  getAspectRatioClasses={getAspectRatioClasses}
                />
              ))}
            </div>
          )}

          {/* Load More Trigger */}
          {hasMore && (
            <div ref={loadMoreRef} className="flex items-center justify-center py-8">
              {isLoadingMore ? (
                <div className="text-center">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Loading more videos...</p>
                </div>
              ) : (
                <button
                  onClick={() => loadVideos(false)}
                  className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Load More Videos
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Enhanced Video Modal */}
      <AnimatePresence>
        {selectedVideo && (
          <EnhancedVideoModal
            video={selectedVideo}
            onClose={() => setSelectedVideo(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// Interactive Video Gallery Component
interface InteractiveVideoGalleryProps {
  mediaItems: MediaItem[]
  onItemClick: (item: MediaItem) => void
}

function InteractiveVideoGallery({ mediaItems, onItemClick }: InteractiveVideoGalleryProps) {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Simplified Bento Grid Layout */}
        <div className="grid grid-cols-3 gap-4 auto-rows-[200px]">
          {mediaItems.map((item) => (
            <InteractiveMediaCard
              key={item.id}
              item={item}
              onClick={() => onItemClick(item)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// Interactive Media Card Component
interface InteractiveMediaCardProps {
  item: MediaItem
  onClick: () => void
}

function InteractiveMediaCard({ item, onClick }: InteractiveMediaCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting)
      },
      { threshold: 0.5 }
    )

    const currentRef = videoRef.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [])

  useEffect(() => {
    if (videoRef.current) {
      if (isInView) {
        videoRef.current.play().catch(() => {
          // Ignore autoplay errors
        })
      } else {
        videoRef.current.pause()
      }
    }
  }, [isInView])

  return (
    <motion.div
      className={`relative break-inside-avoid cursor-pointer group ${item.span || 'col-span-1 row-span-1'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="relative w-full h-full rounded-xl overflow-hidden shadow-lg">
        <video
          ref={videoRef}
          src={item.src}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />

        <AnimatePresence>
          {isHovered && (
            <motion.div
              className="absolute inset-0 bg-black/30 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className="text-white text-lg font-medium"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
              >
                View
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Duration Badge */}
        <div className="absolute bottom-3 right-3 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
          {formatTime(item.duration)}
        </div>

        {/* Title Overlay */}
        <div className="absolute bottom-3 left-3 right-16">
          <h3 className="text-white text-sm font-medium drop-shadow-lg line-clamp-2">
            {item.title}
          </h3>
          {item.style && (
            <p className="text-white/80 text-xs drop-shadow-lg">
              {item.style}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// Video Card Component
interface VideoCardProps {
  video: VideoGeneration
  viewMode: 'grid' | 'list'
  isSelected: boolean
  onClick: () => void
  enableSelection: boolean
  formatDuration: (seconds: number) => string
  formatDate: (dateString: string) => string
  getAspectRatioClasses: (aspectRatio?: string) => string
}

function VideoCard({
  video,
  viewMode,
  isSelected,
  onClick,
  enableSelection,
  formatDuration,
  formatDate,
  getAspectRatioClasses
}: VideoCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleMouseEnter = () => {
    setIsHovered(true)
    if (videoRef.current && !videoError) {
      videoRef.current.play().catch(() => {
        // Ignore autoplay errors
      })
      setIsPlaying(true)
    }
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
      setIsPlaying(false)
    }
  }

  const duration = video.parameters?.duration || video.media_files?.[0]?.video_duration || 5
  const aspectRatio = video.parameters?.aspectRatio || '16:9'
  const thumbnailUrl = video.media_files?.[0]?.thumbnail_url

  return (
    <div
      className={`group relative bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md cursor-pointer ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      } ${viewMode === 'list' ? 'flex' : ''}`}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Video Container */}
      <div className={`relative bg-gray-100 ${
        viewMode === 'list' 
          ? 'w-48 flex-shrink-0' 
          : getAspectRatioClasses(aspectRatio)
      }`}>
        {videoError ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <div className="text-center text-gray-500">
              <VideoCameraIcon className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">Video unavailable</p>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              muted
              loop
              preload="metadata"
              poster={thumbnailUrl}
              onError={() => setVideoError(true)}
            >
              <source src={getProxiedVideoUrl(video.id)} type="video/mp4" />
            </video>

            {/* Play/Pause Overlay */}
            <div className={`absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center transition-opacity ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}>
              {isPlaying ? (
                <PauseIcon className="h-12 w-12 text-white" />
              ) : (
                <PlayIcon className="h-12 w-12 text-white" />
              )}
            </div>

            {/* Selection Checkbox */}
            {enableSelection && (
              <div className="absolute top-2 left-2">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}} // Handled by parent onClick
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Duration Badge */}
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
              {formatDuration(duration)}
            </div>

            {/* Status Badge */}
            {video.status !== 'completed' && (
              <div className={`absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded ${
                video.status === 'processing' 
                  ? 'bg-yellow-100 text-yellow-800'
                  : video.status === 'failed'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {video.status}
              </div>
            )}
          </>
        )}
      </div>

      {/* Video Info */}
      <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
        <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
          {video.prompt}
        </h3>
        
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
          <div className="flex items-center gap-1">
            <CalendarIcon className="h-4 w-4" />
            {formatDate(video.created_at)}
          </div>
          <div className="flex items-center gap-1">
            <ClockIcon className="h-4 w-4" />
            {formatDuration(duration)}
          </div>
        </div>

        {video.parameters?.style && (
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <TagIcon className="h-4 w-4" />
            {video.parameters.style}
          </div>
        )}

        {viewMode === 'list' && (
          <div className="mt-2 text-sm text-gray-500">
            <p>Model: {video.model_used || 'Unknown'}</p>
            <p>Credits: {video.credits_used}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Enhanced Video Modal Component
interface EnhancedVideoModalProps {
  video: VideoGeneration
  onClose: () => void
}

function EnhancedVideoModal({ video, onClose }: EnhancedVideoModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [volume, setVolume] = useState(1)
  const [progress, setProgress] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const aspectRatio = extractAspectRatio(video)
  const [widthStr, heightStr] = aspectRatio.split(':')
  const width = parseInt(widthStr) || 16
  const height = parseInt(heightStr) || 9
  const aspectRatioNumber = width / height

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleVolumeChange = (value: number) => {
    if (videoRef.current) {
      const newVolume = value / 100
      videoRef.current.volume = newVolume
      setVolume(newVolume)
      setIsMuted(newVolume === 0)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const progress =
        (videoRef.current.currentTime / videoRef.current.duration) * 100
      setProgress(isFinite(progress) ? progress : 0)
      setCurrentTime(videoRef.current.currentTime)
      setDuration(videoRef.current.duration)
    }
  }

  const handleSeek = (value: number) => {
    if (videoRef.current && videoRef.current.duration) {
      const time = (value / 100) * videoRef.current.duration
      if (isFinite(time)) {
        videoRef.current.currentTime = time
        setProgress(value)
      }
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
      if (!isMuted) {
        setVolume(0)
      } else {
        setVolume(1)
        videoRef.current.volume = 1
      }
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative max-w-4xl max-h-[90vh] w-full"
        style={{ aspectRatio: aspectRatioNumber }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <video
          ref={videoRef}
          className="w-full h-full rounded-xl object-contain"
          onTimeUpdate={handleTimeUpdate}
          src={getProxiedVideoUrl(video.id)}
          autoPlay
          loop
          onClick={togglePlay}
        />

        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-white hover:bg-white/20"
        >
          <X className="h-6 w-6" />
        </Button>

        <AnimatePresence>
          {showControls && (
            <motion.div
              className="absolute bottom-4 left-4 right-4 p-4 bg-black/50 backdrop-blur-md rounded-xl"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-white text-sm">
                  {formatTime(currentTime)}
                </span>
                <CustomSlider
                  value={progress}
                  onChange={handleSeek}
                  className="flex-1"
                />
                <span className="text-white text-sm">{formatTime(duration)}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={togglePlay}
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5" />
                    )}
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={toggleMute}
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                    >
                      {isMuted ? (
                        <VolumeX className="h-5 w-5" />
                      ) : volume > 0.5 ? (
                        <Volume2 className="h-5 w-5" />
                      ) : (
                        <Volume1 className="h-5 w-5" />
                      )}
                    </Button>
                    <div className="w-24">
                      <CustomSlider
                        value={volume * 100}
                        onChange={handleVolumeChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Video Info */}
                <div className="text-right">
                  <p className="text-white text-sm font-medium">
                    {video.prompt.length > 40 ? video.prompt.substring(0, 40) + '...' : video.prompt}
                  </p>
                  <p className="text-white/80 text-xs">
                    {video.parameters?.style} • {aspectRatio} • {video.credits_used} credits
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
