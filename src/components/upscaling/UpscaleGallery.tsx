'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Search, X, User, Download, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAuth } from '@clerk/nextjs'

// Types
interface UpscaledImage {
  id: string
  src: string
  alt: string
  originalSrc?: string
  user: {
    name: string
    avatar: string
  }
  prompt?: string
  createdAt?: string
  scaleFactor?: number
  enhancement?: string
}

interface UpscaleGalleryProps {
  isOpen: boolean
  onClose: () => void
  onImageSelect?: (image: UpscaledImage) => void
  className?: string
}

// Header Component
const Header = ({ onClose }: { onClose: () => void }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-border/20">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
            <X className="w-6 h-6" />
          </button>
          <h1 className="ml-4 text-lg font-semibold">Upscaled Images</h1>
        </div>
        
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search upscaled images..."
              className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border/30 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
        </div>
      </div>
    </header>
  )
}

// Modal Component for Image Details
const ImageModal = ({ 
  image, 
  isOpen, 
  onClose, 
  onSelect 
}: { 
  image: UpscaledImage | null
  isOpen: boolean
  onClose: () => void
  onSelect?: (image: UpscaledImage) => void
}) => {
  if (!image) return null

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = image.src
    link.download = `upscaled_${image.id}.png`
    link.click()
  }

  const handleSelect = () => {
    if (onSelect) {
      onSelect(image)
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg max-w-6xl max-h-[90vh] overflow-hidden flex"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-1 flex items-center justify-center min-w-0 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                {image.originalSrc && (
                  <div>
                    <h3 className="font-medium mb-2">Original</h3>
                    <img
                      src={image.originalSrc}
                      alt="Original"
                      className="w-full rounded-lg border object-contain max-h-96"
                    />
                  </div>
                )}
                <div>
                  <h3 className="font-medium mb-2">Upscaled ({image.scaleFactor}x)</h3>
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full rounded-lg border object-contain max-h-96"
                  />
                </div>
              </div>
            </div>
            
            <div className="w-80 p-6 border-l border-border flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={image.user.avatar}
                    alt={image.user.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="font-medium">{image.user.name}</span>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-muted rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="mb-4">
                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full mb-2">
                  Upscaled {image.scaleFactor}x
                </span>
                {image.enhancement && image.enhancement !== 'none' && (
                  <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full mb-2 ml-2">
                    {image.enhancement}
                  </span>
                )}
              </div>
              
              {image.prompt && (
                <div className="mb-4">
                  <h3 className="font-medium mb-2">Original Prompt</h3>
                  <p className="text-sm text-muted-foreground">{image.prompt}</p>
                </div>
              )}
              
              <div className="flex flex-col gap-2">
                {onSelect && (
                  <button 
                    onClick={handleSelect}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Use for Upscaling
                  </button>
                )}
                <button 
                  onClick={handleDownload}
                  className="w-full px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Grid Component
const UpscaleGrid = ({ 
  images, 
  onImageClick 
}: { 
  images: UpscaledImage[]
  onImageClick: (image: UpscaledImage) => void 
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {images.map((image, index) => (
        <motion.div
          key={image.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="group cursor-pointer"
          onClick={() => onImageClick(image)}
        >
          <div className="relative overflow-hidden rounded-lg bg-muted aspect-[3/4] h-80">
            <img
              src={image.src}
              alt={image.alt}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            <div className="absolute bottom-3 left-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <img
                src={image.user.avatar}
                alt={image.user.name}
                className="w-6 h-6 rounded-full border-2 border-white"
              />
              <span className="text-white text-sm font-medium drop-shadow-lg">
                {image.user.name}
              </span>
            </div>
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="px-2 py-1 bg-blue-600/90 backdrop-blur-sm rounded-full text-white text-xs font-medium">
                {image.scaleFactor}x
              </span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// Main Upscale Gallery Component
export const UpscaleGallery = ({ 
  isOpen, 
  onClose, 
  onImageSelect, 
  className 
}: UpscaleGalleryProps) => {
  const { userId } = useAuth()
  const [images, setImages] = useState<UpscaledImage[]>([])
  const [selectedImage, setSelectedImage] = useState<UpscaledImage | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Load upscaled images
  const loadUpscaledImages = useCallback(async () => {
    if (!userId || !isOpen) return

    setLoading(true)
    try {
      const response = await fetch('/api/generations?type=upscale&status=completed&limit=50')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.generations) {
          const upscaledImages: UpscaledImage[] = data.generations
            .filter((gen: any) => gen.media_files && gen.media_files.length > 0)
            .map((gen: any) => {
              const mediaFile = gen.media_files[0]
              return {
                id: gen.id,
                src: mediaFile.thumbnail_url || `/api/media/${mediaFile.id}`,
                alt: gen.prompt || 'Upscaled image',
                originalSrc: gen.metadata?.originalImageUrl || gen.metadata?.original_image_url,
                user: {
                  name: 'You',
                  avatar: '/api/placeholder/32/32'
                },
                prompt: gen.prompt,
                createdAt: gen.created_at,
                scaleFactor: gen.metadata?.scaleFactor || gen.metadata?.scale_factor || 2,
                enhancement: gen.metadata?.enhancement || 'none'
              }
            })
          setImages(upscaledImages)
        }
      }
    } catch (error) {
      console.error('Failed to load upscaled images:', error)
    } finally {
      setLoading(false)
    }
  }, [userId, isOpen])

  useEffect(() => {
    if (isOpen) {
      loadUpscaledImages()
    }
  }, [isOpen, loadUpscaledImages])

  const handleImageClick = (image: UpscaledImage) => {
    setSelectedImage(image)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedImage(null)
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn("fixed inset-0 z-40 bg-white", className)}
    >
      <Header onClose={onClose} />
      
      <main className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold mb-4"
            >
              Your Upscaled Images
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground"
            >
              Browse and reuse your AI-enhanced images
            </motion.p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : images.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <UpscaleGrid images={images} onImageClick={handleImageClick} />
            </motion.div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No upscaled images found. Start by upscaling some images!</p>
            </div>
          )}
        </div>
      </main>

      <ImageModal
        image={selectedImage}
        isOpen={isModalOpen}
        onClose={closeModal}
        onSelect={onImageSelect}
      />
    </motion.div>
  )
}
