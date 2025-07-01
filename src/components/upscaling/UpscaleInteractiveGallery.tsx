"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Search, X, User, ChevronLeft, ChevronRight, Download, Sparkles, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from '@clerk/nextjs';

// Enhanced Image Component with Error Handling
const ImageWithFallback: React.FC<{
  src: string
  alt: string
  className?: string
  fallbackSrc?: string
}> = ({ src, alt, className, fallbackSrc = '/api/placeholder/300/400' }) => {
  const [currentSrc, setCurrentSrc] = useState(src)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Only reset if the src actually changed
    if (src !== currentSrc) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      setCurrentSrc(src)
      setIsLoading(true)
      setHasError(false)
      setLoadedSrc(null)

      // Set a timeout to fallback if image takes too long to load
      timeoutRef.current = setTimeout(() => {
        // Only timeout if we haven't successfully loaded this src yet
        if (loadedSrc !== src) {
          console.log(`🖼️ Gallery image timeout: ${src}, falling back to: ${fallbackSrc}`)
          setCurrentSrc(fallbackSrc)
          setIsLoading(false)
          setHasError(true)
        }
      }, 15000) // 15 second timeout
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [src]) // Remove fallbackSrc from dependencies to prevent unnecessary re-runs

  const handleError = () => {
    // Clear timeout since we got an error event
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    if (currentSrc !== fallbackSrc) {
      console.log(`🖼️ Gallery image failed to load: ${currentSrc}, falling back to: ${fallbackSrc}`)
      setCurrentSrc(fallbackSrc)
      setHasError(true)
    } else {
      console.error(`🖼️ Gallery fallback image also failed to load: ${fallbackSrc}`)
      setHasError(true)
    }
    setIsLoading(false)
  }

  const handleLoad = () => {
    // Clear timeout since image loaded successfully
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    // Mark this src as successfully loaded
    setLoadedSrc(currentSrc)
    setIsLoading(false)
    setHasError(false)
    console.log(`🖼️ Gallery image loaded successfully: ${currentSrc}`)
  }

  return (
    <div className={cn("relative", className)}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
        </div>
      )}
      <img
        src={currentSrc}
        alt={alt}
        className={cn("w-full h-full object-cover transition-transform duration-300 group-hover:scale-105", isLoading && "opacity-0")}
        onError={handleError}
        onLoad={handleLoad}
        loading="eager"
      />
      {hasError && currentSrc === fallbackSrc && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
          <ImageIcon className="w-8 h-8 text-gray-400" />
        </div>
      )}
    </div>
  )
}

// Types
interface UpscaledImage {
  id: string;
  src: string;
  originalSrc?: string;
  alt: string;
  user: {
    name: string;
    avatar: string;
  };
  prompt?: string;
  createdAt?: string;
  scaleFactor?: number;
  enhancement?: string;
}

interface UpscaleGalleryProps {
  className?: string;
  isOpen: boolean;
  onClose: () => void;
  onImageSelect?: (image: UpscaledImage) => void;
}

// Sample upscaled images data
const sampleUpscaledImages: UpscaledImage[] = [
  {
    id: "1",
    src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=1200&fit=crop",
    originalSrc: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop",
    alt: "Upscaled mountain landscape",
    user: { name: "alex_photo", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face" },
    prompt: "A serene mountain landscape at sunset",
    scaleFactor: 2,
    enhancement: "AI Enhanced"
  },
  {
    id: "2",
    src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=1000&fit=crop", 
    originalSrc: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=500&fit=crop",
    alt: "Upscaled forest path",
    user: { name: "nature_lover", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face" },
    prompt: "Mystical forest path with dappled sunlight",
    scaleFactor: 4,
    enhancement: "Sharpen"
  },
  {
    id: "3",
    src: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=1100&fit=crop",
    originalSrc: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=550&fit=crop",
    alt: "Upscaled city skyline",
    user: { name: "urban_explorer", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face" },
    prompt: "Futuristic city skyline at night",
    scaleFactor: 2,
    enhancement: "Denoise"
  },
  {
    id: "4",
    src: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=1300&fit=crop",
    originalSrc: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=650&fit=crop",
    alt: "Upscaled ocean waves",
    user: { name: "wave_rider", avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face" },
    prompt: "Powerful ocean waves crashing on rocks",
    scaleFactor: 4,
    enhancement: "AI Enhanced"
  }
];

// Header Component
const Header = ({ onClose }: { onClose: () => void }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-border/20">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
            <X className="w-6 h-6" />
          </button>
          <h1 className="ml-4 text-lg font-semibold">Upscaled Images Gallery</h1>
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
  );
};

// Modal Component
const ImageModal = ({
  image,
  isOpen,
  onClose,
  onSelect
}: {
  image: UpscaledImage | null;
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (image: UpscaledImage) => void;
}) => {
  if (!image) return null;

  const handleSelect = () => {
    if (onSelect) {
      onSelect(image);
    }
    onClose();
  };

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
            className="bg-white rounded-lg max-w-7xl max-h-[90vh] overflow-hidden flex relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top-right close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors"
              title="Close"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Image Display Section */}
            <div className="flex-1 flex flex-col min-w-0 bg-gray-100">
              {/* Image Display */}
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="relative">
                  <ImageWithFallback
                    src={image.src}
                    alt={image.alt}
                    className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/75 text-white px-2 py-1 rounded text-sm">
                    Upscaled {image.scaleFactor}x
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="w-80 p-6 border-l border-border flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <ImageWithFallback
                    src={image.user.avatar}
                    alt={image.user.name}
                    className="w-8 h-8 rounded-full"
                    fallbackSrc="/api/placeholder/32/32"
                  />
                  <span className="font-medium">{image.user.name}</span>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex gap-2 mb-2">
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {image.scaleFactor}x Upscaled
                  </span>
                  {image.enhancement && image.enhancement !== 'none' && (
                    <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                      {image.enhancement}
                    </span>
                  )}
                </div>
              </div>

              {image.prompt && (
                <div className="mb-4">
                  <h3 className="font-medium mb-2">Original Prompt</h3>
                  <p className="text-sm text-muted-foreground">{image.prompt}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleSelect}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Use for Upscaling
                </button>
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = image.src;
                    link.download = `upscaled_${image.alt}`;
                    link.click();
                  }}
                  className="px-4 py-2 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Grid Component
const UpscaledGrid = ({ 
  images, 
  onImageClick 
}: { 
  images: UpscaledImage[]; 
  onImageClick: (image: UpscaledImage) => void 
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {images.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="group cursor-pointer"
          onClick={() => onImageClick(item)}
        >
          <div className="relative overflow-hidden rounded-lg bg-muted aspect-[3/4] h-80">
            <ImageWithFallback
              src={item.src}
              alt={item.alt}
              className="w-full h-full"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            <div className="absolute bottom-3 left-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <ImageWithFallback
                src={item.user.avatar}
                alt={item.user.name}
                className="w-6 h-6 rounded-full border-2 border-white"
                fallbackSrc="/api/placeholder/24/24"
              />
              <span className="text-white text-sm font-medium drop-shadow-lg">
                {item.user.name}
              </span>
            </div>
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="flex gap-2">
                <span className="px-2 py-1 bg-blue-600/90 backdrop-blur-sm rounded-full text-white text-xs font-medium">
                  {item.scaleFactor}x
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Main Gallery Component
export const UpscaleInteractiveGallery = ({
  className,
  isOpen,
  onClose,
  onImageSelect
}: UpscaleGalleryProps) => {
  const { userId } = useAuth()
  const [images, setImages] = useState<UpscaledImage[]>([])
  const [selectedImage, setSelectedImage] = useState<UpscaledImage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load upscaled images
  const loadUpscaledImages = useCallback(async () => {
    if (!userId || !isOpen) return

    setLoading(true)
    try {
      console.log('🖼️ Loading upscaled images for gallery...')
      const response = await fetch('/api/generations?type=upscale&status=completed&limit=50&include_count=true')

      if (response.ok) {
        const data = await response.json()
        console.log('🖼️ Gallery API Response:', data)

        if (data.success && data.generations) {
          const upscaledImages: UpscaledImage[] = data.generations
            .filter((gen: any) => gen.media_files && gen.media_files.length > 0)
            .map((gen: any) => {
              const mediaFile = gen.media_files[0]

              // Construct image URL with proper fallback
              let imageUrl = '/api/placeholder/300/400' // Default fallback

              if (mediaFile.thumbnail_url) {
                imageUrl = mediaFile.thumbnail_url
              } else if (mediaFile.id) {
                imageUrl = `/api/media/${mediaFile.id}`
              }

              console.log(`🖼️ Gallery image ${gen.id}: Using URL: ${imageUrl}`)

              return {
                id: gen.id,
                src: imageUrl,
                alt: gen.prompt || 'Upscaled image',
                originalSrc: gen.metadata?.originalImageUrl || gen.metadata?.original_image_url,
                user: {
                  name: 'You',
                  avatar: '/api/placeholder/32/32'
                },
                prompt: gen.prompt,
                createdAt: gen.created_at,
                scaleFactor: gen.metadata?.scaleFactor || 2,
                enhancement: gen.metadata?.enhancement || 'none'
              }
            })

          console.log('🖼️ Loaded upscaled images for gallery:', upscaledImages)
          setImages(upscaledImages)
        } else {
          console.log('🖼️ No upscaled images found for gallery')
          setImages([])
        }
      } else {
        console.error('🖼️ Failed to fetch upscaled images for gallery:', response.status)
        setImages([])
      }
    } catch (error) {
      console.error('🖼️ Failed to load upscaled images for gallery:', error)
      setImages([])
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
    setSelectedImage(image);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedImage(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
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
                className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4"
              >
                Your Upscaled Images
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-muted-foreground"
              >
                Browse and reuse your previously upscaled images
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
                transition={{ delay: 0.4 }}
              >
                <UpscaledGrid images={images} onImageClick={handleImageClick} />
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
    </AnimatePresence>
  );
};
