'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useAuth } from '@clerk/nextjs'
import { cn } from "@/lib/utils"
import { Button, Badge, Card } from "@/components/ui"
import {
  Upload,
  Image as ImageIcon,
  Plus,
  User,
  Sparkles,
  Video,
  Clock,
  Download,
  Settings,
  Zap
} from 'lucide-react'
import { UpscaleInteractiveGallery } from './UpscaleInteractiveGallery'
import { AnimatePresence, motion } from 'framer-motion'
import { X, ChevronDown, CheckIcon } from 'lucide-react'

// Enhanced Image Component with Error Handling and Loading States
const ImageWithFallback: React.FC<{
  src: string
  alt: string
  className?: string
  fallbackSrc?: string
  onError?: () => void
  onLoad?: () => void
}> = ({ src, alt, className, fallbackSrc = '/api/placeholder/100/100', onError, onLoad }) => {
  const [currentSrc, setCurrentSrc] = useState(src)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setCurrentSrc(src)
    setIsLoading(true)
    setHasError(false)
  }, [src])

  const handleError = () => {
    if (currentSrc !== fallbackSrc) {
      console.log(`🖼️ Image failed to load: ${currentSrc}, falling back to: ${fallbackSrc}`)
      setCurrentSrc(fallbackSrc)
      setHasError(true)
    } else {
      console.error(`🖼️ Fallback image also failed to load: ${fallbackSrc}`)
      setHasError(true)
    }
    setIsLoading(false)
    onError?.()
  }

  const handleLoad = () => {
    setIsLoading(false)
    setHasError(false)
    onLoad?.()
  }

  return (
    <div className={cn("relative", className)}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
        </div>
      )}
      <img
        src={currentSrc}
        alt={alt}
        className={cn("w-full h-full object-cover transition-opacity duration-200", isLoading && "opacity-0")}
        onError={handleError}
        onLoad={handleLoad}
      />
      {hasError && currentSrc === fallbackSrc && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <ImageIcon className="w-6 h-6 text-gray-400" />
        </div>
      )}
    </div>
  )
}

// Types
interface Asset {
  id: string
  name: string
  thumbnail: string
  selected: boolean
  file?: File
  mediaFile?: any
  isUpscaled?: boolean
}

interface Tool {
  id: string
  name: string
  description: string
  badges: string[]
  selected: boolean
}

interface UpscalingOptions {
  scaleFactor: number
  enhancement: 'none' | 'denoise' | 'sharpen' | 'colorize' | 'ai-enhanced'
  outputFormat: 'png' | 'jpeg' | 'webp'
  quality: number
  model: string
}

interface UpscalingResult {
  success: boolean
  imageUrl?: string
  metadata?: any
  creditsUsed?: number
  remainingCredits?: number
  error?: string
}

interface UpscalingModel {
  id: string
  name: string
  display_name: string
  description: string
  pricing_credits: number
  status: 'active' | 'inactive' | 'maintenance'
  enhancement_types: string[]
}

// Upscaling Models Data
const UPSCALING_MODELS: UpscalingModel[] = [
  {
    id: 'vertex-ai-standard',
    name: 'vertex-ai-standard',
    display_name: 'Vertex AI Standard',
    description: 'Google Vertex AI standard upscaling with balanced quality and speed',
    pricing_credits: 2,
    status: 'active',
    enhancement_types: ['none', 'denoise', 'sharpen']
  },
  {
    id: 'vertex-ai-enhanced',
    name: 'vertex-ai-enhanced',
    display_name: 'Vertex AI Enhanced',
    description: 'Advanced AI upscaling with superior quality and detail preservation',
    pricing_credits: 3,
    status: 'active',
    enhancement_types: ['ai-enhanced', 'colorize', 'denoise', 'sharpen']
  },
  {
    id: 'sharp-fallback',
    name: 'sharp-fallback',
    display_name: 'Sharp Fallback',
    description: 'Fast CPU-based upscaling using Sharp library (fallback option)',
    pricing_credits: 1,
    status: 'active',
    enhancement_types: ['none', 'sharpen']
  }
]

// Asset Gallery Component
const AssetGallery: React.FC<{
  assets: Asset[]
  onAssetView: (id: string) => void
  onAddAsset: () => void
  totalCount?: number
}> = ({ assets, onAssetView, onAddAsset, totalCount }) => {
  const displayAssets = assets.slice(0, 10) // Show max 10 in sidebar
  const remainingCount = totalCount ? Math.max(0, totalCount - displayAssets.length) : 0

  return (
    <div className="w-20 bg-background border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <Button
          size="sm"
          onClick={onAddAsset}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white"
          title="Browse all upscaled images"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 p-2 space-y-2 overflow-y-auto">
        {displayAssets.map((asset) => (
          <button
            key={asset.id}
            onClick={() => onAssetView(asset.id)}
            className="w-full h-12 rounded-md overflow-hidden border-2 border-border hover:border-blue-500 transition-colors cursor-pointer"
            title={`${asset.name} - Click to view`}
          >
            <ImageWithFallback
              src={asset.thumbnail}
              alt={asset.name}
              className="w-full h-full"
              onError={() => console.log(`🖼️ Failed to load thumbnail for asset: ${asset.id}`)}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

// Sidebar Image Viewer Modal Component
const SidebarImageViewer: React.FC<{
  asset: Asset | null
  isOpen: boolean
  onClose: () => void
  onSelect?: (asset: Asset) => void
}> = ({ asset, isOpen, onClose, onSelect }) => {
  if (!asset) return null

  const handleSelect = () => {
    if (onSelect) {
      onSelect(asset)
    }
    onClose()
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
            className="bg-white rounded-lg max-w-6xl max-h-[90vh] overflow-hidden flex relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors"
              title="Close"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            <div className="flex-1 flex items-center justify-center min-w-0 bg-gray-100">
              <ImageWithFallback
                src={asset.thumbnail}
                alt={asset.name}
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
            <div className="w-80 p-6 border-l border-border flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-medium">You</span>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex gap-2 mb-2">
                  {asset.isUpscaled && (
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      Upscaled
                    </span>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <h3 className="font-medium mb-2">Image Name</h3>
                <p className="text-sm text-muted-foreground">{asset.name}</p>
              </div>

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
                    const link = document.createElement('a')
                    link.href = asset.thumbnail
                    link.download = asset.name
                    link.click()
                  }}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Tool Selector Component
const ToolSelector: React.FC<{
  tools: Tool[]
  onToolSelect: (id: string) => void
}> = ({ tools, onToolSelect }) => {
  // If there are no tools, this component will not render anything
  if (tools.length === 0) {
    return null
  }

  return (
    <div className="w-80 bg-background border-r border-border p-4">
      <div className="space-y-3">
        {tools.map((tool) => (
          <Card
            key={tool.id}
            className={cn(
              "p-4 cursor-pointer transition-all hover:shadow-md",
              tool.selected ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20" : "border-border"
            )}
            onClick={() => onToolSelect(tool.id)}
          >
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">{tool.name}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {tool.description}
              </p>
              <div className="flex gap-2 flex-wrap">
                {tool.badges.map((badge, index) => (
                  <Badge
                    key={index}
                    variant={index === 0 ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {badge}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Main Interaction Area Component
const MainInteractionArea: React.FC<{
  onUpload: () => void
  onSelectAsset: () => void
  selectedAsset?: Asset
  onClearSelectedAsset: () => void
  isProcessing?: boolean
  options: UpscalingOptions
  onOptionsChange: (options: Partial<UpscalingOptions>) => void
  onUpscale: () => void
  result?: UpscalingResult
  credits: number
}> = ({
  onUpload,
  onSelectAsset,
  selectedAsset,
  onClearSelectedAsset,
  isProcessing,
  options,
  onOptionsChange,
  onUpscale,
  result,
  credits
}) => {
  const getCreditCost = () => {
    const selectedModel = UPSCALING_MODELS.find(model => model.name === options.model)
    const baseCost = selectedModel?.pricing_credits || 2
    const enhancementCost = options.enhancement === 'ai-enhanced' ? 1 : 0
    return baseCost + enhancementCost
  }

  const canUpscale = selectedAsset && !isProcessing && credits >= getCreditCost()

  if (!selectedAsset) {
    return (
      <div className="flex-1 bg-background p-8 flex items-center justify-center">
        <Card className="w-full max-w-md p-8 bg-card border-border">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">AI Image Upscaler</h2>
              <p className="text-muted-foreground leading-relaxed">
                Upload a new image or select an existing one from your gallery to get started with AI upscaling.
              </p>
            </div>

            <div className="flex gap-3 w-full">
              <Button
                onClick={onUpload}
                disabled={isProcessing}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
              <Button
                variant="secondary"
                onClick={onSelectAsset}
                disabled={isProcessing}
                className="flex-1"
              >
                Select asset
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Average processing time: 30-60 seconds
            </p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-background p-6 flex items-center justify-center">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Image Preview & Options */}
        <div className="space-y-4">
          {/* Selected Image Preview */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Selected Image</h3>
              <button
                onClick={onClearSelectedAsset}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                title="Remove selected image"
              >
                <X className="h-4 w-4 text-gray-500 hover:text-gray-700" />
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <ImageWithFallback
                  src={selectedAsset.thumbnail}
                  alt={selectedAsset.name}
                  className="w-20 h-20 object-cover rounded-lg border"
                />
              </div>
              <div>
                <h4 className="font-medium">{selectedAsset.name}</h4>
                <p className="text-sm text-muted-foreground">Ready for upscaling</p>
              </div>
            </div>
          </Card>

          {/* Upscaling Options */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Upscaling Options
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Scale Factor</label>
                <select
                  value={options.scaleFactor}
                  onChange={(e) => onOptionsChange({ scaleFactor: parseInt(e.target.value) })}
                  disabled={isProcessing}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
                >
                  <option value={2}>2x (Double size)</option>
                  <option value={4}>4x (Quadruple size)</option>
                  <option value={8}>8x (8x larger)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Enhancement</label>
                <select
                  value={options.enhancement}
                  onChange={(e) => onOptionsChange({ enhancement: e.target.value as any })}
                  disabled={isProcessing}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
                >
                  <option value="none">None</option>
                  <option value="denoise">Denoise</option>
                  <option value="sharpen">Sharpen</option>
                  <option value="colorize">Colorize</option>
                  <option value="ai-enhanced">AI Enhanced (+1 credit)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Output Format</label>
                <select
                  value={options.outputFormat}
                  onChange={(e) => onOptionsChange({ outputFormat: e.target.value as any })}
                  disabled={isProcessing}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
                >
                  <option value="png">PNG (Lossless)</option>
                  <option value="jpeg">JPEG (Smaller size)</option>
                  <option value="webp">WebP (Modern)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Quality: {options.quality}%
                  {options.outputFormat === 'png' && (
                    <span className="text-xs text-muted-foreground ml-2">(PNG is lossless)</span>
                  )}
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={options.quality}
                  onChange={(e) => onOptionsChange({ quality: parseInt(e.target.value) })}
                  disabled={isProcessing}
                  className={`w-full ${options.outputFormat === 'png' ? 'opacity-50' : ''}`}
                />
                {options.outputFormat === 'png' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Quality setting doesn't affect PNG files as they use lossless compression
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Action Button */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Credit Cost</h4>
                <p className="text-xl font-bold text-blue-600">{getCreditCost()} Credits</p>
                <p className="text-xs text-muted-foreground">You have {credits} credits</p>
              </div>
              <button
                onClick={onUpscale}
                disabled={!canUpscale}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isProcessing ? (
                  <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Sparkles className="h-5 w-5 mr-2" />
                )}
                {isProcessing ? 'Upscaling...' : 'Upscale Image'}
              </button>
            </div>

            {!canUpscale && credits < getCreditCost() && (
              <div className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded">
                Insufficient credits. You need {getCreditCost()} credits but have {credits}.
              </div>
            )}
          </Card>
        </div>

        {/* Right Column - Results */}
        <div className="space-y-4">
          {/* Result Display */}
          {result && result.success && result.imageUrl && (
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Sparkles className="h-5 w-5 mr-2" />
                Upscaled Result
              </h3>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Original</h4>
                  <ImageWithFallback
                    src={selectedAsset.thumbnail}
                    alt="Original"
                    className="w-full rounded-lg border max-h-48 object-contain"
                  />
                </div>
                <div>
                  <h4 className="font-medium mb-2">Upscaled</h4>
                  <ImageWithFallback
                    src={result.imageUrl}
                    alt="Upscaled"
                    className="w-full rounded-lg border max-h-48 object-contain"
                  />
                  <Button
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = result.imageUrl!
                      link.download = `upscaled_${selectedAsset.name}`
                      link.click()
                    }}
                    className="mt-3 w-full"
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Result
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Error Display */}
          {result && !result.success && (
            <Card className="p-4 border-red-200 bg-red-50">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Upscaling Failed</h3>
              <p className="text-red-700">{result.error}</p>
            </Card>
          )}

          {/* Processing Status */}
          {isProcessing && (
            <Card className="p-4 border-blue-200 bg-blue-50">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900">Processing with Google Vertex AI</h4>
                    <p className="text-sm text-blue-700">Analyzing and upscaling your image...</p>
                  </div>
                </div>

                {/* Progress Steps */}
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-blue-700">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse"></div>
                    AI analysis in progress
                  </div>
                  <div className="flex items-center text-sm text-blue-600">
                    <div className="w-2 h-2 bg-blue-300 rounded-full mr-2"></div>
                    Applying enhancements
                  </div>
                  <div className="flex items-center text-sm text-blue-600">
                    <div className="w-2 h-2 bg-blue-300 rounded-full mr-2"></div>
                    Generating high-resolution output
                  </div>
                </div>

                {/* Estimated Time */}
                <div className="text-xs text-blue-700 bg-blue-100 rounded-md p-2 font-medium">
                  ⏱️ Estimated completion: 30-90 seconds
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

// Header Component
const Header: React.FC = () => {
  return (
    <header className="h-16 bg-background border-b border-border px-6 flex items-center justify-between">
      <div className="flex items-center">
        <h1 className="text-xl font-bold text-foreground">AI Image Upscaler</h1>
      </div>
      <div className="flex items-center">
        <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
          <User className="h-4 w-4 text-white" />
        </div>
      </div>
    </header>
  )
}

// Main Component
export const AIImageUpscaler: React.FC = () => {
  const { userId } = useAuth()
  const [assets, setAssets] = useState<Asset[]>([])
  const [tools, setTools] = useState<Tool[]>([]) // Empty tools array as per design
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<Asset | undefined>()
  const [credits, setCredits] = useState<number>(0)
  const [totalAssets, setTotalAssets] = useState<number>(0)
  const [options, setOptions] = useState<UpscalingOptions>({
    scaleFactor: 2,
    enhancement: 'none',
    outputFormat: 'png',
    quality: 90,
    model: 'vertex-ai-standard'
  })
  const [result, setResult] = useState<UpscalingResult | undefined>()
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const [sidebarViewerAsset, setSidebarViewerAsset] = useState<Asset | null>(null)
  const [isSidebarViewerOpen, setIsSidebarViewerOpen] = useState(false)
  const [showModelSelector, setShowModelSelector] = useState(false)
  const modelSelectorRef = useRef<HTMLDivElement>(null)

  // Load user credits
  const loadCredits = useCallback(async () => {
    if (!userId) return

    try {
      const response = await fetch('/api/user/credits')
      if (response.ok) {
        const data = await response.json()
        setCredits(data.balance?.current || 0)
      }
    } catch (error) {
      console.error('Failed to load credits:', error)
    }
  }, [userId])

  // Load user's existing images
  const loadUserAssets = useCallback(async () => {
    if (!userId) return

    try {
      console.log('🖼️ Loading upscaled images...')
      // Load only upscaled images for the sidebar
      const response = await fetch('/api/generations?type=upscale&status=completed&limit=50&include_count=true')
      console.log('🖼️ API Response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('🖼️ API Response data:', data)

        if (data.success && data.generations && data.generations.length > 0) {
          const imageAssets: Asset[] = data.generations
            .filter((gen: any) => gen.media_files && gen.media_files.length > 0)
            .map((gen: any, index: number) => {
              const mediaFile = gen.media_files[0] // Get first media file

              // Construct thumbnail URL with proper fallback chain
              let thumbnailUrl = '/api/placeholder/100/100' // Default fallback

              if (mediaFile.thumbnail_url) {
                thumbnailUrl = mediaFile.thumbnail_url
              } else if (mediaFile.id) {
                thumbnailUrl = `/api/media/${mediaFile.id}`
              }

              console.log(`🖼️ Asset ${gen.id}: Using thumbnail URL: ${thumbnailUrl}`)

              return {
                id: gen.id,
                name: gen.prompt ? gen.prompt.substring(0, 30) + '...' : `Upscaled ${index + 1}`,
                thumbnail: thumbnailUrl,
                selected: false, // Keep for compatibility but not used for selection
                mediaFile: mediaFile,
                isUpscaled: true
              }
            })

          console.log('🖼️ Loaded upscaled assets:', imageAssets)
          setAssets(imageAssets)
          setTotalAssets(data.pagination?.total || imageAssets.length)
        } else {
          console.log('🖼️ No upscaled images found, showing empty sidebar')
          // No sample images for upscaled gallery - it should be empty initially
          setAssets([])
          setTotalAssets(0)
        }
      } else {
        console.error('🖼️ Failed to fetch upscaled images:', response.status)
        setAssets([])
        setTotalAssets(0)
      }
    } catch (error) {
      console.error('🖼️ Failed to load user assets:', error)
    }
  }, [userId])

  useEffect(() => {
    loadCredits()
    loadUserAssets()
  }, [loadCredits, loadUserAssets])

  // Handle click outside for model selector
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelSelectorRef.current && !modelSelectorRef.current.contains(event.target as Node)) {
        setShowModelSelector(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleAssetView = (id: string) => {
    const asset = assets.find(asset => asset.id === id)
    if (asset) {
      setSidebarViewerAsset(asset)
      setIsSidebarViewerOpen(true)
    }
  }

  const handleSidebarViewerSelect = (asset: Asset) => {
    // Select the asset for upscaling
    setSelectedAsset(asset)
    setIsSidebarViewerOpen(false)
  }

  const handleToolSelect = (id: string) => {
    setTools(prev => prev.map(tool => ({
      ...tool,
      selected: tool.id === id
    })))
  }

  const handleAddAsset = () => {
    // Open the upscale gallery
    setIsGalleryOpen(true)
  }

  const handleFileUpload = (file: File) => {
    console.log('📁 File upload started:', file.name, file.type, file.size)

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error('❌ Invalid file type:', file.type)
      alert('Please select an image file (PNG, JPEG, WebP)')
      return
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      console.error('❌ File too large:', file.size)
      alert('File size must be less than 50MB')
      return
    }

    try {
      const newAsset: Asset = {
        id: `upload_${Date.now()}`,
        name: file.name,
        thumbnail: URL.createObjectURL(file),
        selected: false,
        file
      }

      console.log('✅ Asset created:', newAsset.id, newAsset.name)

      // Add to assets but don't auto-select - user needs to click to view/select
      setAssets(prev => [...prev, newAsset])

      // Auto-select the uploaded file for immediate use
      setSelectedAsset(newAsset)

      console.log('✅ File upload completed successfully')
    } catch (error) {
      console.error('❌ Error creating asset:', error)
      alert('Failed to process the uploaded file')
    }
  }

  const handleUpload = () => {
    console.log('🔄 Upload button clicked')

    try {
      // Trigger file upload
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.multiple = false

      input.onchange = (e) => {
        console.log('📂 File input changed')
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) {
          console.log('📄 File selected:', file.name)
          handleFileUpload(file)
        } else {
          console.log('❌ No file selected')
        }

        // Clean up the input element
        input.remove()
      }

      input.onerror = (e) => {
        console.error('❌ File input error:', e)
        input.remove()
      }

      input.oncancel = () => {
        console.log('🚫 File selection cancelled')
        input.remove()
      }

      // Add to DOM temporarily (required for some browsers)
      input.style.display = 'none'
      document.body.appendChild(input)

      // Trigger the file picker
      input.click()

      console.log('✅ File picker opened')
    } catch (error) {
      console.error('❌ Error opening file picker:', error)
      alert('Failed to open file picker')
    }
  }

  const handleSelectAsset = () => {
    setIsGalleryOpen(true)
  }

  const handleGalleryImageSelect = (image: any) => {
    // Convert gallery image to asset format
    const newAsset: Asset = {
      id: image.id,
      name: image.alt,
      thumbnail: image.src,
      selected: false,
      isUpscaled: true
    }

    // Just set as selected asset, don't modify the assets array
    setSelectedAsset(newAsset)
    setIsGalleryOpen(false)
  }

  const handleOptionsChange = (newOptions: Partial<UpscalingOptions>) => {
    setOptions(prev => ({ ...prev, ...newOptions }))
  }

  const handleClearSelectedAsset = () => {
    setSelectedAsset(undefined)
    setResult(undefined) // Also clear any previous results
  }

  const handleUpscale = async () => {
    if (!selectedAsset || isProcessing) return

    setIsProcessing(true)
    setResult(undefined)

    try {
      const formData = new FormData()

      if (selectedAsset.file) {
        formData.append('image', selectedAsset.file)
      } else if (selectedAsset.mediaFile) {
        // For existing images from generations, use the media file ID
        formData.append('mediaFileId', selectedAsset.mediaFile.id)
      } else {
        // For sample images, fetch and convert to file
        const response = await fetch(selectedAsset.thumbnail)
        const blob = await response.blob()
        const file = new File([blob], selectedAsset.name, { type: blob.type })
        formData.append('image', file)
      }

      formData.append('scaleFactor', options.scaleFactor.toString())
      formData.append('enhancement', options.enhancement)
      formData.append('outputFormat', options.outputFormat)
      formData.append('quality', options.quality.toString())
      formData.append('model', options.model)

      const response = await fetch('/api/upscale/image', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upscaling failed')
      }

      setResult(data)
      if (data.remainingCredits !== undefined) {
        setCredits(data.remainingCredits)
      }

      // Reload assets to include the new upscaled image
      if (data.success) {
        loadUserAssets()
      }

    } catch (error) {
      console.error('Upscaling error:', error)
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Upscaling failed'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative">
      <Header />
      <div className="flex-1 flex">
        <AssetGallery
          assets={assets}
          onAssetView={handleAssetView}
          onAddAsset={handleAddAsset}
          totalCount={totalAssets}
        />
        <ToolSelector
          tools={tools}
          onToolSelect={handleToolSelect}
        />
        <MainInteractionArea
          onUpload={handleUpload}
          onSelectAsset={handleSelectAsset}
          selectedAsset={selectedAsset}
          onClearSelectedAsset={handleClearSelectedAsset}
          isProcessing={isProcessing}
          options={options}
          onOptionsChange={handleOptionsChange}
          onUpscale={handleUpscale}
          result={result}
          credits={credits}
        />
      </div>

      {/* Bottom Left - Model Selector */}
      <div className="absolute bottom-6 left-24">
        <div className="relative" ref={modelSelectorRef}>
          <button
            onClick={() => setShowModelSelector(!showModelSelector)}
            className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors bg-card border border-border rounded-lg px-3 py-2 shadow-sm"
            disabled={isProcessing}
          >
            <span>Model: {UPSCALING_MODELS.find(m => m.name === options.model)?.display_name || options.model}</span>
            <ChevronDown className="h-4 w-4" />
          </button>

          {showModelSelector && (
            <div className="absolute bottom-full left-0 mb-2 bg-popover border border-border rounded-lg shadow-lg w-80 max-h-96 overflow-y-auto z-50">
              <div className="p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Select Upscaling Model</h3>
                <div className="space-y-2">
                  {UPSCALING_MODELS.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setOptions(prev => ({ ...prev, model: model.name }))
                        setShowModelSelector(false)
                      }}
                      disabled={model.status !== 'active' || isProcessing}
                      className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                        options.model === model.name
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-border hover:border-border/60 hover:bg-muted/50'
                      } ${model.status !== 'active' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-foreground truncate">
                              {model.display_name}
                            </h4>
                            {options.model === model.name && (
                              <CheckIcon className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-1">
                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                              model.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {model.status}
                            </span>
                            <span className="text-xs text-muted-foreground font-medium">
                              {model.pricing_credits} credits
                            </span>
                          </div>

                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {model.description}
                          </p>

                          <div className="flex flex-wrap gap-1 mt-2">
                            {model.enhancement_types.map((enhancement) => (
                              <span key={enhancement} className="inline-block px-1.5 py-0.5 text-xs bg-muted text-muted-foreground rounded">
                                {enhancement}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upscale Gallery Modal */}
      <UpscaleInteractiveGallery
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onImageSelect={handleGalleryImageSelect}
      />

      {/* Sidebar Image Viewer Modal */}
      <SidebarImageViewer
        asset={sidebarViewerAsset}
        isOpen={isSidebarViewerOpen}
        onClose={() => setIsSidebarViewerOpen(false)}
        onSelect={handleSidebarViewerSelect}
      />
    </div>
  )
}
