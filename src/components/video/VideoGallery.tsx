'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import {
  PlayIcon,
  Squares2X2Icon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  TrashIcon,
  ShareIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import { VideoPlayer } from './VideoPlayer'
import {
  getThumbnailAspectRatio,
  getModalContainerClasses,
  getAspectRatioConfig,
  getGalleryThumbnailClasses,
  getLayoutConfig,
  isPortraitAspectRatio,
  isLandscapeAspectRatio
} from '@/lib/utils/aspect-ratio'

interface VideoGeneration {
  id: string
  prompt: string
  result_url: string
  status: string
  created_at: string
  completed_at: string
  metadata: {
    duration: number
    aspectRatio: string
    style: string
    quality: string
    provider: string
    resolution?: { width: number; height: number }
    fileSize?: number
  }
  credits_used: number
}

// Helper function to get proxied video URL
const getProxiedVideoUrl = (generationId: string): string => {
  return `/api/video/proxy?id=${encodeURIComponent(generationId)}`
}

type ViewMode = 'grid' | 'list'
type SortBy = 'newest' | 'oldest' | 'duration' | 'style'
type FilterBy = 'all' | 'realistic' | 'artistic' | 'cartoon' | 'cinematic' | 'documentary'

export function VideoGallery() {
  const { userId } = useAuth()
  const [videos, setVideos] = useState<VideoGeneration[]>([])
  const [selectedVideo, setSelectedVideo] = useState<VideoGeneration | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState<SortBy>('newest')
  const [filterBy, setFilterBy] = useState<FilterBy>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set())

  // Load videos
  useEffect(() => {
    if (userId) {
      loadVideos()
    }
  }, [userId])

  const loadVideos = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/generate/video')
      if (response.ok) {
        const data = await response.json()
        setVideos(data.generations?.filter((g: any) => g.type === 'video' && g.status === 'completed') || [])
      }
    } catch (error) {
      console.error('Failed to load videos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter and sort videos
  const filteredAndSortedVideos = videos
    .filter(video => {
      // Filter by style
      if (filterBy !== 'all' && video.metadata?.style !== filterBy) {
        return false
      }
      
      // Filter by search query
      if (searchQuery && !video.prompt.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'duration':
          return (b.metadata?.duration || 0) - (a.metadata?.duration || 0)
        case 'style':
          return (a.metadata?.style || '').localeCompare(b.metadata?.style || '')
        default:
          return 0
      }
    })

  const handleVideoSelect = (video: VideoGeneration) => {
    setSelectedVideo(video)
  }

  const handleVideoDelete = async (videoId: string) => {
    if (confirm('Are you sure you want to delete this video?')) {
      try {
        // In a real implementation, you'd call a delete API
        setVideos(prev => prev.filter(v => v.id !== videoId))
        if (selectedVideo?.id === videoId) {
          setSelectedVideo(null)
        }
      } catch (error) {
        console.error('Failed to delete video:', error)
      }
    }
  }

  const handleBulkDelete = async () => {
    if (selectedVideos.size === 0) return
    
    if (confirm(`Are you sure you want to delete ${selectedVideos.size} video(s)?`)) {
      try {
        // In a real implementation, you'd call a bulk delete API
        setVideos(prev => prev.filter(v => !selectedVideos.has(v.id)))
        setSelectedVideos(new Set())
      } catch (error) {
        console.error('Failed to delete videos:', error)
      }
    }
  }

  const toggleVideoSelection = (videoId: string) => {
    setSelectedVideos(prev => {
      const newSet = new Set(prev)
      if (newSet.has(videoId)) {
        newSet.delete(videoId)
      } else {
        newSet.add(videoId)
      }
      return newSet
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStyleIcon = (style: string) => {
    const icons: Record<string, string> = {
      realistic: '📷',
      artistic: '🎨',
      cartoon: '🎭',
      cinematic: '🎬',
      documentary: '📹'
    }
    return icons[style] || '🎥'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Video Gallery</h1>
          <p className="text-gray-600">
            {filteredAndSortedVideos.length} video{filteredAndSortedVideos.length !== 1 ? 's' : ''}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md ${
              viewMode === 'grid' ? 'bg-primary-100 text-primary-700' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Squares2X2Icon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md ${
              viewMode === 'list' ? 'bg-primary-100 text-primary-700' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <ListBulletIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="duration">By Duration</option>
            <option value="style">By Style</option>
          </select>

          {/* Filter */}
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as FilterBy)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Styles</option>
            <option value="realistic">Realistic</option>
            <option value="artistic">Artistic</option>
            <option value="cartoon">Cartoon</option>
            <option value="cinematic">Cinematic</option>
            <option value="documentary">Documentary</option>
          </select>

          {/* Bulk Actions */}
          {selectedVideos.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center justify-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              <TrashIcon className="h-4 w-4 mr-1" />
              Delete ({selectedVideos.size})
            </button>
          )}
        </div>
      </div>

      {/* Video Grid/List */}
      {filteredAndSortedVideos.length === 0 ? (
        <div className="text-center py-12">
          <PlayIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No videos found</h3>
          <p className="text-gray-500">
            {searchQuery || filterBy !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Generate your first video to get started'
            }
          </p>
        </div>
      ) : (
        <div className={
          viewMode === 'grid'
            ? (() => {
                // Analyze aspect ratios for optimal grid layout
                const hasPortraitVideos = filteredAndSortedVideos.some(video =>
                  isPortraitAspectRatio(video.metadata?.aspectRatio || '16:9')
                )
                const hasLandscapeVideos = filteredAndSortedVideos.some(video =>
                  isLandscapeAspectRatio(video.metadata?.aspectRatio || '16:9')
                )

                if (hasPortraitVideos && !hasLandscapeVideos) {
                  // Portrait-optimized grid
                  return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
                } else if (hasLandscapeVideos && !hasPortraitVideos) {
                  // Landscape-optimized grid
                  return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'
                } else {
                  // Mixed aspect ratios - balanced grid
                  return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                }
              })()
            : 'space-y-4'
        }>
          {filteredAndSortedVideos.map((video) => (
            <div
              key={video.id}
              className={`
                bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow
                ${viewMode === 'list' ? 'flex' : ''}
              `}
              onClick={() => handleVideoSelect(video)}
            >
              {/* Video Thumbnail with Responsive Sizing */}
              <div className={`relative bg-gray-100 ${
                viewMode === 'list'
                  ? 'w-48 flex-shrink-0'
                  : getGalleryThumbnailClasses(video.metadata?.aspectRatio || '16:9')
              }`}>
                <video
                  className="w-full h-full object-cover"
                  muted
                  poster="/api/placeholder/400/225"
                  onError={(e) => {
                    console.error('🎬 VIDEO GALLERY: Error loading video thumbnail:', video.id, e)
                  }}
                >
                  <source src={getProxiedVideoUrl(video.id)} type="video/mp4" />
                </video>
                
                {/* Play Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <PlayIcon className="h-12 w-12 text-white" />
                </div>

                {/* Selection Checkbox */}
                <div className="absolute top-2 left-2">
                  <input
                    type="checkbox"
                    checked={selectedVideos.has(video.id)}
                    onChange={(e) => {
                      e.stopPropagation()
                      toggleVideoSelection(video.id)
                    }}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </div>

                {/* Duration Badge */}
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                  {video.metadata?.duration || 5}s
                </div>
              </div>

              {/* Video Info */}
              <div className="p-4 flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900 line-clamp-2">
                    {video.prompt.length > 60 ? `${video.prompt.substring(0, 60)}...` : video.prompt}
                  </h3>
                  <div className="flex items-center space-x-1 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        // Handle share
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <ShareIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleVideoDelete(video.id)
                      }}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    {getStyleIcon(video.metadata?.style || '')}
                    <span className="ml-1 capitalize">{video.metadata?.style}</span>
                  </span>
                  <span>{video.metadata?.aspectRatio}</span>
                  <span>{formatDate(video.created_at)}</span>
                </div>

                {viewMode === 'list' && (
                  <div className="mt-2 text-sm text-gray-600">
                    Quality: {video.metadata?.quality} • Provider: {video.metadata?.provider}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Modal with Responsive Sizing */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`bg-white rounded-lg ${getModalContainerClasses(selectedVideo.metadata?.aspectRatio || '16:9')} w-full max-h-[90vh] overflow-y-auto`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Video Details</h2>
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <VideoPlayer
                videoUrl={selectedVideo.result_url}
                metadata={selectedVideo.metadata}
                prompt={selectedVideo.prompt}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
