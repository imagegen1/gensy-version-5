'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { 
  PhotoIcon,
  VideoCameraIcon,
  Squares2X2Icon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { EnhancedImageCard } from './EnhancedImageCard'
import { VideoCard } from './VideoCard'
import MasonryMediaGallery from './InteractiveMediaGallery'

// Helper function to get proxied video URL
const getProxiedVideoUrl = (generationId: string): string => {
  return `/api/video/proxy?id=${encodeURIComponent(generationId)}`
}

interface MediaItem {
  id: string
  type: 'image' | 'video'
  url: string
  prompt: string
  metadata?: any
  created_at: string
  isLiked?: boolean
  thumbnail?: string // For videos
  duration?: number // For videos
}

type ViewMode = 'grid' | 'list' | 'masonry'
type SortBy = 'newest' | 'oldest' | 'liked'
type FilterBy = 'all' | 'images' | 'videos'

interface UnifiedGalleryProps {
  className?: string
  showHeader?: boolean
  maxItems?: number
}

export function UnifiedGallery({ 
  className = '', 
  showHeader = true,
  maxItems 
}: UnifiedGalleryProps) {
  const { userId } = useAuth()
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState<SortBy>('newest')
  const [filterBy, setFilterBy] = useState<FilterBy>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  // Load media items
  useEffect(() => {
    if (userId) {
      loadMediaItems()
    }
  }, [userId])

  const loadMediaItems = async () => {
    setIsLoading(true)
    try {
      // Load both images and videos
      const [imagesResponse, videosResponse] = await Promise.all([
        fetch('/api/user/images'),
        fetch('/api/generate/video')
      ])

      const images = imagesResponse.ok ? await imagesResponse.json() : { images: [] }
      const videos = videosResponse.ok ? await videosResponse.json() : { generations: [] }

      // Transform and combine data
      const imageItems: MediaItem[] = (images.images || []).map((img: any) => ({
        id: img.id,
        type: 'image' as const,
        url: img.file_path,
        prompt: img.generations?.prompt || 'Generated image',
        metadata: img.generations?.parameters || img.metadata,
        created_at: img.created_at,
        isLiked: false // TODO: Implement likes
      }))

      const videoItems: MediaItem[] = (videos.generations || [])
        .filter((gen: any) => gen.type === 'video' && gen.status === 'completed')
        .map((gen: any) => ({
          id: gen.id,
          type: 'video' as const,
          url: getProxiedVideoUrl(gen.id), // Use proxy URL instead of direct GCS URL
          prompt: gen.prompt,
          metadata: gen.metadata,
          created_at: gen.created_at,
          duration: gen.metadata?.duration || 5,
          thumbnail: gen.metadata?.thumbnail || getProxiedVideoUrl(gen.id),
          isLiked: false // TODO: Implement likes
        }))

      const allItems = [...imageItems, ...videoItems]
      setMediaItems(maxItems ? allItems.slice(0, maxItems) : allItems)
    } catch (error) {
      console.error('Failed to load media items:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter and sort items
  const filteredAndSortedItems = mediaItems
    .filter(item => {
      // Filter by type
      if (filterBy === 'images' && item.type !== 'image') return false
      if (filterBy === 'videos' && item.type !== 'video') return false
      
      // Filter by search query
      if (searchQuery && !item.prompt.toLowerCase().includes(searchQuery.toLowerCase())) {
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
        case 'liked':
          return (b.isLiked ? 1 : 0) - (a.isLiked ? 1 : 0)
        default:
          return 0
      }
    })

  const handleItemClick = (item: MediaItem) => {
    setSelectedItem(item)
  }

  const handleVideoGenerated = (video: any) => {
    // Add new video to the gallery
    const newVideoItem: MediaItem = {
      id: video.generationId || Date.now().toString(),
      type: 'video',
      url: video.generationId ? getProxiedVideoUrl(video.generationId) : video.videoUrl,
      prompt: video.prompt || 'Generated video',
      metadata: video.metadata,
      created_at: new Date().toISOString(),
      duration: video.metadata?.duration || 5,
      thumbnail: video.metadata?.thumbnail || (video.generationId ? getProxiedVideoUrl(video.generationId) : video.videoUrl)
    }

    setMediaItems(prev => [newVideoItem, ...prev])
  }

  const handleLike = (itemId: string) => {
    setMediaItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, isLiked: !item.isLiked } : item
    ))
  }

  const handleDelete = async (itemId: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      // TODO: Implement delete API call
      setMediaItems(prev => prev.filter(item => item.id !== itemId))
    }
  }

  const handleShare = (item: MediaItem) => {
    // TODO: Implement sharing functionality
    navigator.clipboard.writeText(item.url)
    alert('Link copied to clipboard!')
  }

  const handleDownload = (item: MediaItem) => {
    const link = document.createElement('a')
    link.href = item.url
    link.download = `gensy-${item.type}-${item.id}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  const getFilterCounts = () => {
    const images = mediaItems.filter(item => item.type === 'image').length
    const videos = mediaItems.filter(item => item.type === 'video').length
    return { images, videos, total: images + videos }
  }

  const counts = getFilterCounts()

  // Convert media items to masonry gallery format
  const convertToMasonryItems = (items: MediaItem[]) => {
    return items.map((item) => {
      // Calculate aspect ratio based on type
      let aspectRatio = 1.0 // Default square

      if (item.type === 'video') {
        // Most videos are 16:9 landscape
        aspectRatio = 16 / 9
      } else {
        // Images can vary, default to portrait for variety
        aspectRatio = Math.random() > 0.5 ? 16/9 : 9/16
      }

      return {
        id: item.id,
        type: item.type,
        src: item.url,
        aspectRatio: aspectRatio,
        user: {
          name: "You",
          avatar: "/api/placeholder/40/40"
        }
      }
    })
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your gallery...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Gallery</h1>
            <p className="text-gray-600">
              {counts.total} items • {counts.images} images • {counts.videos} videos
            </p>
          </div>
          <button
            onClick={loadMediaItems}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            <ArrowPathIcon className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search your creations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Filters and View Controls */}
        <div className="flex items-center space-x-4">
          {/* Filter */}
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as FilterBy)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All ({counts.total})</option>
            <option value="images">Images ({counts.images})</option>
            <option value="videos">Videos ({counts.videos})</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="liked">Liked First</option>
          </select>

          {/* View Mode */}
          <div className="flex border border-gray-300 rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              title="Grid View"
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              title="List View"
            >
              <ListBulletIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('masonry')}
              className={`p-2 ${viewMode === 'masonry' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              title="Masonry Gallery"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 3a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V3zM3 9a1 1 0 011-1h3a1 1 0 011 1v7a1 1 0 01-1 1H4a1 1 0 01-1-1V9zM10 3a1 1 0 011-1h3a1 1 0 011 1v7a1 1 0 01-1 1h-3a1 1 0 01-1-1V3zM10 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
      {filteredAndSortedItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {filterBy === 'images' ? (
              <PhotoIcon className="h-8 w-8 text-gray-400" />
            ) : filterBy === 'videos' ? (
              <VideoCameraIcon className="h-8 w-8 text-gray-400" />
            ) : (
              <Squares2X2Icon className="h-8 w-8 text-gray-400" />
            )}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? 'No matching items found' : `No ${filterBy === 'all' ? 'items' : filterBy} yet`}
          </h3>
          <p className="text-gray-600">
            {searchQuery 
              ? 'Try adjusting your search terms'
              : `Start creating ${filterBy === 'all' ? 'images and videos' : filterBy} to see them here`
            }
          </p>
        </div>
      ) : viewMode === 'masonry' ? (
        <MasonryMediaGallery
          items={convertToMasonryItems(filteredAndSortedItems)}
        />
      ) : (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
        }>
          {filteredAndSortedItems.map((item) => (
            item.type === 'image' ? (
              <EnhancedImageCard
                key={item.id}
                image={item}
                onImageClick={handleItemClick}
                onVideoGenerated={handleVideoGenerated}
                onLike={handleLike}
                onDelete={handleDelete}
                onShare={handleShare}
                onDownload={handleDownload}
                className={viewMode === 'list' ? 'flex' : ''}
              />
            ) : (
              <VideoCard
                key={item.id}
                video={item}
                onVideoClick={handleItemClick}
                onLike={handleLike}
                onDelete={handleDelete}
                onShare={handleShare}
                onDownload={handleDownload}
                className={viewMode === 'list' ? 'flex' : ''}
              />
            )
          ))}
        </div>
      )}

      {/* Item Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedItem.type === 'image' ? 'Image' : 'Video'} Details
                </h2>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {selectedItem.type === 'image' ? (
                <img
                  src={selectedItem.url}
                  alt={selectedItem.prompt}
                  className="w-full max-h-96 object-contain rounded-lg"
                />
              ) : (
                <video
                  src={selectedItem.url}
                  controls
                  className="w-full max-h-96 object-contain rounded-lg"
                />
              )}

              <div className="mt-4">
                <h3 className="font-medium text-gray-900 mb-2">Prompt</h3>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedItem.prompt}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
