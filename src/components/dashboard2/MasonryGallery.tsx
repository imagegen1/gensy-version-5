'use client'

import React, { useEffect, useState } from 'react'
import { GalleryItem } from './GalleryItem'
import { GalleryImage } from '@/app/dashboard2MockData'

interface MasonryGalleryProps {
  images: GalleryImage[]
  onLoadMore?: () => void
}

export function MasonryGallery({ images, onLoadMore }: MasonryGalleryProps) {
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 1000
      ) {
        if (onLoadMore && !isLoading) {
          setIsLoading(true)
          onLoadMore()
          setTimeout(() => setIsLoading(false), 1000)
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [onLoadMore, isLoading])

  return (
    <div className="px-4">
      <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-4 space-y-0">
        {images.map((item) => (
          <GalleryItem key={item.id} item={item} />
        ))}
      </div>
      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
      )}
    </div>
  )
}