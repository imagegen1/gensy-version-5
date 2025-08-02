'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useNotifications } from '@/components/ui/notification-system'
import {
  PlayIcon,
  Expand,
  X,
  Plus,
  Paperclip,
  Mic,
  CornerRightUp
} from 'lucide-react'
import { useAuth, useUser, SignInButton } from '@clerk/nextjs'
import { useToast } from '@/components/ui/Toast'
import {
  getThumbnailAspectRatio,
  getGalleryThumbnailClasses,
  getLayoutConfig,
  getResponsiveVideoClasses,
  isPortraitAspectRatio,
  isLandscapeAspectRatio
} from '@/lib/utils/aspect-ratio'

// Helper function to get proxied video URL
const getProxiedVideoUrl = (generationId: string): string => {
  return `/api/video/proxy?id=${encodeURIComponent(generationId)}`
}

interface AspectRatio {
  id: string
  label: string
  ratio: string
  width: number
  height: number
}

interface AIModel {
  id: string
  name: string
  description: string
  isNew?: boolean
  tags?: string[]
  pricing_credits?: number
}

interface GeneratedVideo {
  id: string
  url: string
  prompt: string
  aspectRatio: string
  model: string
  style?: string
  quality?: string
  resolution?: string
  duration?: number
  createdAt: string
  thumbnailUrl?: string
  isLoading?: boolean
  error?: string
}

interface GenerationResult {
  success: boolean
  generation?: any
  videoUrl?: string
  metadata?: any
  creditsUsed?: number
  remainingCredits?: number
  error?: string
}

interface PreloadedImageData {
  url: string
  prompt: string
  style: string
  aspectRatio: string
  model: string
  quality: string
  createdAt: string
}

interface EnhancedVideoGenerationInterfaceProps {
  preloadedImageData?: PreloadedImageData | null
}

export function EnhancedVideoGenerationInterface({ preloadedImageData }: EnhancedVideoGenerationInterfaceProps) {
  const { addToast } = useToast()
  const { addNotification, clearAllNotifications } = useNotifications()
  const { isSignedIn, userId } = useAuth()
  const { user } = useUser()

  // Test mode for development - bypass authentication
  const isTestMode = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_TEST_MODE === 'true'
  const effectivelySignedIn = isSignedIn || isTestMode
  const effectiveUserId = userId || (isTestMode ? 'test-user' : null)

  // Debug logging
  console.log('🔍 AUTH DEBUG:', {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_TEST_MODE: process.env.NEXT_PUBLIC_TEST_MODE,
    isTestMode,
    isSignedIn,
    effectivelySignedIn,
    userId,
    effectiveUserId
  })

  const [prompt, setPrompt] = useState('')
  const [showAspectRatioPopover, setShowAspectRatioPopover] = useState(false)
  const [showResolutionDropdown, setShowResolutionDropdown] = useState(false)
  const [showDurationDropdown, setShowDurationDropdown] = useState(false)
  const [showModelSelector, setShowModelSelector] = useState(false)
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('16:9')
  const [selectedModel, setSelectedModel] = useState('Google Veo')
  const [selectedStyle, setSelectedStyle] = useState('realistic')
  const [selectedQuality, setSelectedQuality] = useState('standard')
  const [selectedResolution, setSelectedResolution] = useState('720p')
  const [duration, setDuration] = useState(5)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [startFrameFile, setStartFrameFile] = useState<File | null>(null)
  const [endFrameFile, setEndFrameFile] = useState<File | null>(null)
  const [filePreviews, setFilePreviews] = useState<{ [key: string]: string }>({})
  const [aiModels, setAiModels] = useState<AIModel[]>([])
  const [isLoadingModels, setIsLoadingModels] = useState(true)

  // Video display and management
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([])
  const [currentVideo, setCurrentVideo] = useState<GeneratedVideo | null>(null)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [videoError, setVideoError] = useState<string | null>(null)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [activeTab, setActiveTab] = useState<'reference' | 'start' | 'end'>('reference')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const startFrameInputRef = useRef<HTMLInputElement>(null)
  const endFrameInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const aspectRatioDropdownRef = useRef<HTMLDivElement>(null)
  const resolutionDropdownRef = useRef<HTMLDivElement>(null)
  const durationDropdownRef = useRef<HTMLDivElement>(null)
  const modelSelectorRef = useRef<HTMLDivElement>(null)

  const aspectRatios: AspectRatio[] = [
    { id: '16:9', label: '16:9 (Landscape)', ratio: '16:9', width: 16, height: 9 },
    { id: '9:16', label: '9:16 (Portrait)', ratio: '9:16', width: 9, height: 16 },
  ]

  // Get available durations based on selected model
  const getAvailableDurations = () => {
    const model = selectedModel.toLowerCase()

    // MiniMax Hailuo models support 6s and 10s (Hailuo 02), 6s only (Directors)
    if (model.includes('minimax') || model.includes('hailuo') || model.includes('director')) {
      if (model.includes('hailuo 02') || model.includes('hailuo-02')) {
        return [
          { value: 6, label: '6 seconds', description: 'Standard duration' },
          { value: 10, label: '10 seconds', description: 'Extended duration' }
        ]
      } else {
        // T2V-01-Director and I2V-01-Director support only 6s
        return [
          { value: 6, label: '6 seconds', description: 'Standard duration' }
        ]
      }
    }

    // ByteDance Seedream model supports 5s and 10s
    if (model.includes('bytedance') || model.includes('seedream')) {
      return [
        { value: 5, label: '5 seconds', description: 'Standard duration' },
        { value: 10, label: '10 seconds', description: 'Extended duration' }
      ]
    }

    // Google Veo models support 5s and 8s
    if (model.includes('veo') || model.includes('google')) {
      return [
        { value: 5, label: '5 seconds', description: 'Standard duration' },
        { value: 8, label: '8 seconds', description: 'Extended duration' }
      ]
    }

    // Default fallback (Google Veo)
    return [
      { value: 5, label: '5 seconds', description: 'Standard duration' },
      { value: 8, label: '8 seconds', description: 'Extended duration' }
    ]
  }

  // Get available resolutions based on selected model
  const getAvailableResolutions = () => {
    const model = selectedModel.toLowerCase()

    // MiniMax Hailuo models support different resolutions
    if (model.includes('minimax') || model.includes('hailuo') || model.includes('director')) {
      if (model.includes('hailuo 02') || model.includes('hailuo-02')) {
        // Hailuo 02 supports 1080p and 768p
        return [
          { value: '768p', label: '768p (HD+)', description: 'Enhanced HD quality' },
          { value: '1080p', label: '1080p (Full HD)', description: 'Full high definition' }
        ]
      } else {
        // T2V-01-Director and I2V-01-Director support 720p only
        return [
          { value: '720p', label: '720p (HD)', description: 'High definition' }
        ]
      }
    }

    // ByteDance Seedance Pro model supports only 480p and 1080p
    if (model.includes('pro') || model.includes('250528')) {
      return [
        { value: '480p', label: '480p (Standard)', description: 'Standard quality' },
        { value: '1080p', label: '1080p (Full HD)', description: 'High quality' }
      ]
    }

    // Other ByteDance models support 480p and 720p
    if (model.includes('bytedance') || model.includes('seedream')) {
      return [
        { value: '480p', label: '480p (Standard)', description: 'Standard quality' },
        { value: '720p', label: '720p (HD)', description: 'High definition' }
      ]
    }

    // Google Veo and other models support 720p and 1080p
    return [
      { value: '720p', label: '720p (HD)', description: 'High definition' },
      { value: '1080p', label: '1080p (Full HD)', description: 'Full high definition' }
    ]
  }

  // Check if the selected model supports image-to-video generation
  const supportsImageToVideo = () => {
    const model = selectedModel.toLowerCase()

    // MiniMax models support image-to-video based on model type
    if (model.includes('minimax') || model.includes('hailuo') || model.includes('director')) {
      // T2V-01-Director does NOT support image-to-video (text-to-video only)
      if (model.includes('t2v') || model.includes('t2v-01-director')) {
        return false
      }
      // Hailuo 02 and I2V-01-Director support image-to-video
      return true
    }

    // Veo 3.0 Fast does NOT support image-to-video
    if (model.includes('veo 3.0 fast')) {
      return false
    }

    // All other models support image-to-video
    return true
  }

  // Style options
  const STYLES = [
    { value: 'realistic', label: 'Realistic', icon: '📷' },
    { value: 'artistic', label: 'Artistic', icon: '🎨' },
    { value: 'cartoon', label: 'Cartoon', icon: '🎭' },
    { value: 'cinematic', label: 'Cinematic', icon: '🎬' },
    { value: 'documentary', label: 'Documentary', icon: '📹' }
  ]

  // Load AI models from API
  useEffect(() => {
    const loadAIModels = async () => {
      try {
        setIsLoadingModels(true)
        const response = await fetch('/api/ai-models?type=video')
        if (response.ok) {
          const models = await response.json()
          const transformedModels = models.map((model: any) => ({
            id: model.id,
            name: model.display_name,
            description: model.description,
            isNew: model.is_featured,
            tags: model.capabilities?.textToVideo ? ['Video'] : [],
            provider: model.provider,
            pricing_credits: model.pricing_credits
          }))
          setAiModels(transformedModels)
          if (transformedModels.length > 0) {
            setSelectedModel(transformedModels[0].name)
          }
        } else {
          setAiModels([
            { id: 'veo-001', name: 'Google Veo', description: 'Advanced video generation with text-to-video and image-to-video capabilities', isNew: false, tags: ['Video'], pricing_credits: 10 },
            { id: 'veo-002', name: 'Google Veo 2', description: 'Latest Google video model with ultra-high-quality generation and frame-to-video support', isNew: true, tags: ['Video'], pricing_credits: 15 },
            { id: 'hailuo-02', name: 'MiniMax Hailuo 02', description: 'SOTA instruction following with extreme physics mastery. Supports both text-to-video and image-to-video generation.', isNew: true, tags: ['Video'], pricing_credits: 12 },
            { id: 't2v-01-director', name: 'T2V-01-Director', description: 'Enhanced precision shot control for text-to-video generation with cinematic quality.', isNew: false, tags: ['Video'], pricing_credits: 10 },
            { id: 'i2v-01-director', name: 'I2V-01-Director', description: 'Enhanced precision shot control for image-to-video generation with cinematic quality.', isNew: false, tags: ['Video'], pricing_credits: 10 }
          ])
          setSelectedModel('MiniMax Hailuo 02')
        }
      } catch (error) {
        setAiModels([
          { id: 'veo-001', name: 'Google Veo', description: 'Advanced video generation with text-to-video and image-to-video capabilities', isNew: false, tags: ['Video'], pricing_credits: 10 },
          { id: 'veo-002', name: 'Google Veo 2', description: 'Latest Google video model with ultra-high-quality generation and frame-to-video support', isNew: true, tags: ['Video'], pricing_credits: 15 },
          { id: 'hailuo-02', name: 'MiniMax Hailuo 02', description: 'SOTA instruction following with extreme physics mastery. Supports both text-to-video and image-to-video generation.', isNew: true, tags: ['Video'], pricing_credits: 12 },
          { id: 't2v-01-director', name: 'T2V-01-Director', description: 'Enhanced precision shot control for text-to-video generation with cinematic quality.', isNew: false, tags: ['Video'], pricing_credits: 10 },
          { id: 'i2v-01-director', name: 'I2V-01-Director', description: 'Enhanced precision shot control for image-to-video generation with cinematic quality.', isNew: false, tags: ['Video'], pricing_credits: 10 }
        ])
        setSelectedModel('MiniMax Hailuo 02')
      } finally {
        setIsLoadingModels(false)
      }
    }

    loadAIModels()
  }, [])

  // Update duration when model changes to ensure it's valid for the selected model
  useEffect(() => {
    const availableDurations = getAvailableDurations()
    const currentDurationAvailable = availableDurations.some(d => d.value === duration)

    if (!currentDurationAvailable) {
      // Set to the first available duration (default)
      setDuration(availableDurations[0].value)
    }
  }, [selectedModel, duration])

  // Update resolution when model changes to ensure it's valid for the selected model
  useEffect(() => {
    const availableResolutions = getAvailableResolutions()
    const currentResolutionAvailable = availableResolutions.some(r => r.value === selectedResolution)

    if (!currentResolutionAvailable) {
      // Set to the first available resolution (default)
      setSelectedResolution(availableResolutions[0].value)
    }
  }, [selectedModel, selectedResolution])

  // Clear uploaded files when switching to a model that doesn't support image-to-video
  useEffect(() => {
    if (!supportsImageToVideo() && (files.length > 0 || startFrameFile || endFrameFile)) {
      setFiles([])
      setFilePreviews({})
      setStartFrameFile(null)
      setEndFrameFile(null)
      console.log(`🚫 Cleared uploaded files - ${selectedModel} does not support image-to-video generation`)
    }
  }, [selectedModel, files.length, startFrameFile, endFrameFile])

  // Helper function to detect image format from file
  const detectImageFormat = (file: File): string => {
    const extension = file.name.toLowerCase().split('.').pop() || ''
    if (extension === 'png') return 'png'
    if (extension === 'jpg' || extension === 'jpeg') return 'jpeg'
    if (extension === 'webp') return 'webp'
    if (extension === 'gif') return 'gif'
    if (extension === 'bmp') return 'bmp'
    if (extension === 'tiff' || extension === 'tif') return 'tiff'
    return 'unknown'
  }

  // Show notifications for model limitations
  useEffect(() => {
    // Clear all notifications first
    clearAllNotifications()

    // Check for VEO 3.0 image-to-video limitation
    if (selectedModel === 'Google Veo 3.0' && files.length > 0) {
      addNotification({
        type: 'warning',
        title: 'VEO 3 Image-to-Video Unavailable',
        message: 'VEO 3 image-to-video generation is currently unavailable. Please try using text-to-video or VEO 2 for image-to-video generation instead.',
        duration: 0, // Persistent notification
        dismissible: true,
        uniqueKey: 'veo3-image-to-video-warning' // Unique key to prevent duplicates
      })
    }

    // Check for ByteDance Seedance Pro PNG limitation
    else if (selectedModel === 'ByteDance Seedance Pro' && files.length > 0) {
      const file = files[0]
      const imageFormat = detectImageFormat(file)

      if (imageFormat === 'png') {
        addNotification({
          type: 'warning',
          title: 'PNG Format Not Supported',
          message: 'ByteDance Seedance Pro does not support PNG images. Please try uploading a JPG/JPEG image instead for better compatibility.',
          duration: 0, // Persistent notification
          dismissible: true,
          uniqueKey: 'seedance-pro-png-warning' // Unique key to prevent duplicates
        })
      }
    }
  }, [selectedModel, files, addNotification, clearAllNotifications])

  // 🧹 Automatic cleanup utility function
  const cleanupFailedGenerations = useCallback(async () => {
    try {
      console.log('🧹 AUTO-CLEANUP: Starting automatic cleanup of failed generations...')

      // Clean up failed generations older than 1 hour
      const response = await fetch('/api/generations/cleanup?olderThanHours=1', {
        method: 'DELETE'
      })

      if (response.ok) {
        const result = await response.json()
        console.log('🧹 AUTO-CLEANUP: Cleanup completed:', result.message)
        console.log('🧹 AUTO-CLEANUP: Statistics:', result.statistics)
      } else {
        console.log('🧹 AUTO-CLEANUP: Cleanup failed:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('🧹 AUTO-CLEANUP: Error during cleanup:', error)
    }
  }, [])

  // Load user's previous videos
  const loadUserVideos = useCallback(async () => {

    try {
      const response = await fetch('/api/generations?type=video&status=completed&limit=50&include_count=true')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.generations && Array.isArray(data.generations)) {
          console.log('🎬 GALLERY: Processing API response:', data.generations.length, 'generations found')

          const userVideos: GeneratedVideo[] = data.generations
            .filter((generation: any) => generation.result_url)
            .map((generation: any) => {
              console.log('🎬 GALLERY: Processing generation:', {
                id: generation.id,
                status: generation.status,
                result_url: generation.result_url,
                prompt: generation.prompt,
                parameters: generation.parameters
              })

              // Get thumbnail URL from media_files if available
              const thumbnailUrl = generation.media_files?.[0]?.thumbnail_url || null

              return {
                id: generation.id,
                url: generation.result_url,
                prompt: generation.prompt || 'No prompt available',
                aspectRatio: generation.parameters?.aspectRatio || '16:9',
                model: generation.model || generation.model_used || 'Unknown',
                style: generation.parameters?.style || 'realistic',
                quality: generation.parameters?.quality || 'standard',
                resolution: generation.parameters?.resolution || '720p',
                duration: generation.parameters?.duration || 5,
                createdAt: generation.created_at,
                thumbnailUrl: thumbnailUrl,
                isLoading: false
              }
            })

          console.log('🎬 GALLERY: Processed videos:', userVideos.length, 'valid videos')
          setGeneratedVideos(userVideos)
        } else {
          console.log('🎬 GALLERY: No generations found in API response')
          setGeneratedVideos([])
        }
      } else {
        console.log('🎬 GALLERY: API response not successful:', response.status, response.statusText)
        setGeneratedVideos([])
      }
    } catch (error) {
      console.error('🎬 GALLERY: Error loading videos:', error)
      setGeneratedVideos([])
    }
  }, [])

  useEffect(() => {
    loadUserVideos()
    // 🧹 Run automatic cleanup when component loads
    cleanupFailedGenerations()
  }, [loadUserVideos, cleanupFailedGenerations])

  // Auto-resize textarea
  useEffect(() => {
    if (!textareaRef.current) return
    textareaRef.current.style.height = 'auto'
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
  }, [prompt])

  // Close dropdowns when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (aspectRatioDropdownRef.current && !aspectRatioDropdownRef.current.contains(event.target as Node)) {
        setShowAspectRatioPopover(false)
      }
      if (resolutionDropdownRef.current && !resolutionDropdownRef.current.contains(event.target as Node)) {
        setShowResolutionDropdown(false)
      }
      if (durationDropdownRef.current && !durationDropdownRef.current.contains(event.target as Node)) {
        setShowDurationDropdown(false)
      }
      if (modelSelectorRef.current && !modelSelectorRef.current.contains(event.target as Node)) {
        setShowModelSelector(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowAspectRatioPopover(false)
        setShowResolutionDropdown(false)
        setShowDurationDropdown(false)
        setShowModelSelector(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Handle pre-loaded image data from image generator
  useEffect(() => {
    if (preloadedImageData) {
      // Set the prompt based on the image prompt
      setPrompt(`Animate this image: ${preloadedImageData.prompt}`)

      // Convert the image URL to a File object and set it in the files state
      fetch(preloadedImageData.url)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
          return response.blob()
        })
        .then(blob => {
          // Create a File object from the blob
          const file = new File([blob], 'generated-image.jpg', { type: blob.type })
          setFiles([file])

          // Create preview for the file
          const reader = new FileReader()
          reader.onload = (e) => {
            setFilePreviews({ [file.name]: e.target?.result as string })
          }
          reader.readAsDataURL(file)

          // Set other options based on image data
          if (preloadedImageData.aspectRatio) {
            setSelectedAspectRatio(preloadedImageData.aspectRatio)
          }
          if (preloadedImageData.style) {
            setSelectedStyle(preloadedImageData.style)
          }
        })
        .catch(error => {
          console.error('Failed to load image for video generation:', error)
          // Fallback: just set the prompt
          setPrompt(`Animate this image: ${preloadedImageData.prompt}`)
        })
    }
  }, [preloadedImageData])

  const hasContent = prompt.trim().length > 0 || files.length > 0 || startFrameFile || endFrameFile

  const handleImageUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setFiles([file])
      const reader = new FileReader()
      reader.onload = (e) => {
        setFilePreviews({ [file.name]: e.target?.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleStartFrameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setStartFrameFile(file)
    }
  }

  const handleEndFrameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setEndFrameFile(file)
    }
  }

  const handleStartRecording = () => {
    setIsRecording(true)
  }

  const handleStopRecording = () => {
    setIsRecording(false)
  }

  const handleEnhancePrompt = async () => {
    if (!prompt.trim() || prompt.trim().length < 3) return

    setIsEnhancing(true)
    try {
      const response = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          type: 'video',
          testMode: isTestMode
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.enhancedPrompt) {
          setPrompt(data.enhancedPrompt)
        }
      }
    } catch (error) {
      console.error('Failed to enhance prompt:', error)
    } finally {
      setIsEnhancing(false)
    }
  }

  const handleVideoError = (videoId: string) => {
    setGeneratedVideos(prev =>
      prev.map(video =>
        video.id === videoId
          ? { ...video, error: 'Failed to load video' }
          : video
      )
    )
  }

  const handleVideoLoad = (videoId: string) => {
    setGeneratedVideos(prev =>
      prev.map(video =>
        video.id === videoId
          ? { ...video, error: undefined }
          : video
      )
    )
  }

  const handleVideoClick = (video: GeneratedVideo) => {
    setCurrentVideo(video)
    setShowVideoModal(true)
  }

  const handleGenerate = async () => {
    // Check authentication first - use direct Clerk values for more reliability
    if (!isTestMode && (!isSignedIn || !userId)) {
      setVideoError('Please sign in to generate videos')
      addToast({
        title: 'Authentication Required',
        description: 'Please sign in to generate videos',
        type: 'error'
      })
      return
    }

    // Prevent double-click race condition
    if (isGenerating) {
      console.log('⚠️ FRONTEND: Generation already in progress. Ignoring duplicate request.')
      return
    }

    // Validate prompt length (API requires minimum 3 characters)
    if (!prompt.trim() || prompt.trim().length < 3) {
      console.log('🚫 Generation blocked: Prompt must be at least 3 characters')
      setVideoError('Please enter a prompt with at least 3 characters')
      return
    }

    // Validate prompt length (API has maximum 1000 characters)
    if (prompt.trim().length > 1000) {
      console.log('🚫 Generation blocked: Prompt too long')
      setVideoError('Prompt must be less than 1000 characters')
      return
    }

    const requestId = `frontend_video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    console.log(`🚀 [${requestId}] FRONTEND: Starting video generation`)

    // Clear previous errors and reset progress
    setVideoError(null)
    setGenerationProgress(0)
    setIsGenerating(true)

    // Create a temporary video entry to show loading state
    const tempVideoId = `temp_${Date.now()}`
    const tempVideo: GeneratedVideo = {
      id: tempVideoId,
      url: '',
      prompt: prompt.trim(),
      aspectRatio: selectedAspectRatio,
      model: selectedModel,
      style: selectedStyle,
      quality: selectedQuality,
      resolution: selectedResolution,
      duration: duration,
      createdAt: new Date().toISOString(),
      isLoading: true
    }

    setCurrentVideo(tempVideo)
    setGeneratedVideos(prev => [tempVideo, ...prev])

    // Simulate progress during generation
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) return prev
        return prev + Math.random() * 10
      })
    }, 2000) // Slower progress for video generation

    try {
      // Process uploaded files to base64 if any
      let referenceImageBase64: string | undefined = undefined
      let referenceImageMimeType: string | undefined = undefined
      let startFrameBase64: string | undefined = undefined
      let endFrameBase64: string | undefined = undefined

      if (files.length > 0) {
        const file = files[0]
        referenceImageBase64 = await fileToBase64(file)
        referenceImageMimeType = file.type // Capture the MIME type
      }

      if (startFrameFile) {
        startFrameBase64 = await fileToBase64(startFrameFile)
      }

      if (endFrameFile) {
        endFrameBase64 = await fileToBase64(endFrameFile)
      }

      // Determine source type based on uploaded files
      let sourceType = 'text-to-video'
      if (startFrameFile && endFrameFile) {
        sourceType = 'frame-to-video'
      } else if (startFrameFile) {
        sourceType = 'start-frame-video'
      } else if (files.length > 0) {
        const file = files[0]
        sourceType = file.type.startsWith('video/') ? 'video-to-video' : 'image-to-video'
      }

      const requestPayload = {
        prompt: prompt.trim(),
        duration: duration,
        aspectRatio: selectedAspectRatio,
        style: selectedStyle,
        quality: selectedQuality,
        resolution: selectedResolution,
        model: selectedModel,
        sourceType,
        testMode: isTestMode,
        ...(referenceImageBase64 && {
          referenceImage: referenceImageBase64,
          referenceImageMimeType: referenceImageMimeType
        }),
        ...(startFrameBase64 && { startFrameImage: startFrameBase64 }),
        ...(endFrameBase64 && { endFrameImage: endFrameBase64 })
      }

      console.log(`📡 [${requestId}] FRONTEND: Making API request to /api/generate/video`)
      const response = await fetch('/api/generate/video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Ensure authentication cookies are sent
        body: JSON.stringify(requestPayload),
      })

      console.log(`📨 [${requestId}] FRONTEND: Response received, status: ${response.status}`)
      const result = await response.json()
      console.log(`📋 [${requestId}] FRONTEND: Response data:`, result)

      // Handle authentication errors specifically
      if (response.status === 401) {
        console.error(`🔐 [${requestId}] FRONTEND: Authentication failed. User may not be signed in.`)
        throw new Error('Authentication failed. Please sign in and try again.')
      }

      if (!response.ok) {
        const errorMessage = result.error || 'Failed to generate video'

        // Enhanced error handling for Veo 3.0 allowlist issues
        if (errorMessage.includes('image-to-video generation requires allowlist access')) {
          throw new Error(`🚫 Veo 3.0 Image-to-Video Not Available\n\nYour Google Cloud project needs allowlist access for Veo 3.0 image-to-video generation.\n\n✅ Solutions:\n• Switch to "Google Veo 2.0" model (supports image-to-video)\n• Apply for Veo 3.0 allowlist access in Google Cloud Console\n• Use text-to-video with Veo 3.0 instead`)
        }

        if (errorMessage.includes('Veo 3.0 access not available')) {
          throw new Error(`🚫 Veo 3.0 Access Required\n\n${errorMessage}\n\n💡 Try switching to "Google Veo 2.0" which is available without allowlist access.`)
        }

        throw new Error(errorMessage)
      }

      // Handle async processing response
      if (result.status === 'processing' && result.generationId && (result.operationName || result.taskId)) {
        console.log(`✅ [${requestId}] FRONTEND: Video generation started successfully!`)
        console.log(`🔄 [${requestId}] FRONTEND: Starting polling for generationId: ${result.generationId}`)
        console.log(`🔄 [${requestId}] FRONTEND: Provider: ${result.provider}, OperationName: ${result.operationName}, TaskId: ${result.taskId}`)

        // Start polling for completion
        startVideoPolling(result.generationId, result.operationName, tempVideoId, progressInterval, result.provider, result.taskId)

        // Clear the prompt after successful generation start
        setPrompt('')

      } else if (result.success && result.videoUrl) {
        // Handle immediate success (shouldn't happen with async processing)
        clearInterval(progressInterval)
        setGenerationProgress(100)

        const finalVideo: GeneratedVideo = {
          id: result.generationId || result.generation?.id || tempVideoId,
          url: result.videoUrl,
          prompt: prompt.trim(),
          aspectRatio: selectedAspectRatio,
          model: selectedModel,
          style: selectedStyle,
          quality: selectedQuality,
          resolution: selectedResolution,
          duration: duration,
          createdAt: new Date().toISOString(),
          isLoading: false
        }

        setCurrentVideo(finalVideo)
        setGeneratedVideos(prev =>
          prev.map(video => video.id === tempVideoId ? finalVideo : video)
        )
        setPrompt('')
        setIsGenerating(false)

        setTimeout(() => {
          loadUserVideos(false)
        }, 1000)
      } else {
        throw new Error(result.error || 'Generation failed')
      }

    } catch (error) {
      clearInterval(progressInterval)
      setGenerationProgress(0)

      let errorMessage = 'Unknown error occurred'
      if (error instanceof Error) {
        errorMessage = error.message
      }

      console.error(`❌ [${requestId}] FRONTEND: Video generation error:`, error)

      // Enhanced error handling for Veo 3.0 access issues
      if (errorMessage.includes('image-to-video generation requires allowlist access')) {
        setVideoError(`🚫 Veo 3.0 Image-to-Video Not Available

Your Google Cloud project needs allowlist access for Veo 3.0 image-to-video generation.

✅ Quick Solutions:
• Switch to "Google Veo 2.0" - Supports image-to-video without allowlist
• Use text-to-video with Veo 3.0 instead (remove the uploaded image)
• Apply for allowlist access in Google Cloud Console

💡 Tip: Veo 2.0 produces excellent image-to-video results and is immediately available!`)
        addToast({
          type: 'warning',
          title: 'Veo 3.0 Image-to-Video Requires Allowlist',
          description: 'Switch to Veo 2.0 for immediate access'
        })
      } else if (errorMessage.includes('allowlist access') || errorMessage.includes('Veo 3.0 access not available')) {
        setVideoError(`🚫 Veo 3.0 Access Required

${errorMessage}

💡 Quick Fix: Switch to "Google Veo 2.0" which is available without allowlist access.`)
        addToast({
          type: 'warning',
          title: 'Veo 3.0 not available',
          description: 'Try Veo 2.0 instead'
        })
      } else {
        setVideoError(errorMessage)
        addToast({
          type: 'error',
          title: 'Video generation failed',
          description: errorMessage
        })
      }

      // Update the temp video with error state
      setGeneratedVideos(prev =>
        prev.map(video =>
          video.id === tempVideoId
            ? { ...video, isLoading: false, error: errorMessage }
            : video
        )
      )

      if (currentVideo?.id === tempVideoId) {
        setCurrentVideo(null)
      }

      setIsGenerating(false)
    }
  }

  const startVideoPolling = async (generationId: string, operationName: string, tempVideoId: string, progressInterval: NodeJS.Timeout, provider?: string, taskId?: string) => {
    const pollRequestId = `poll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    console.log(`🔄 [${pollRequestId}] FRONTEND: Starting video polling for generation ${generationId}`)
    console.log(`🔄 [${pollRequestId}] FRONTEND: Provider: ${provider}, TaskId: ${taskId}`)

    let pollAttempts = 0
    const maxPollAttempts = 60 // 5 minutes with 5-second intervals

    const pollForCompletion = async () => {
      try {
        pollAttempts++
        console.log(`🔄 [${pollRequestId}] FRONTEND: Poll attempt ${pollAttempts}/${maxPollAttempts}`)

        const response = await fetch('/api/generate/video/poll', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'X-Requested-With': 'XMLHttpRequest'
          },
          credentials: 'include', // Ensure authentication cookies are sent
          body: JSON.stringify({
            generationId,
            // Only set gcsOutputDirectory for Google providers, not ByteDance
            gcsOutputDirectory: provider === 'bytedance' ? undefined : `gs://gensy-final/video-outputs/${generationId}`,
            provider,
            taskId,
            operationName, // Add operation name for enhanced polling
            testMode: isTestMode
          })
        })

        // Handle authentication errors specifically BEFORE parsing JSON
        if (response.status === 401) {
          console.error(`🔐 [${pollRequestId}] FRONTEND: Authentication failed during polling. This might be a session timeout.`)

          // Try to parse the error response, but don't fail if it's not JSON
          let errorDetails = 'Unknown authentication error'
          try {
            const errorResult = await response.json()
            errorDetails = errorResult.error || errorResult.message || 'Authentication failed'
            console.error(`🔐 [${pollRequestId}] FRONTEND: Error details:`, errorResult)
          } catch (parseError) {
            console.warn(`🔐 [${pollRequestId}] FRONTEND: Could not parse error response as JSON`)
          }

          // Try to refresh the page to re-authenticate
          if (pollAttempts > 3) { // Only show error after a few attempts
            setError('Authentication session expired. Please refresh the page and try again.')
            setIsGenerating(false)
            clearInterval(progressInterval)
            return
          }

          // Continue polling for a few more attempts in case it's a temporary issue
          console.log(`🔄 [${pollRequestId}] FRONTEND: Retrying authentication in 10 seconds...`)
          setTimeout(pollForCompletion, 10000) // Wait longer before retry
          return
        }

        // Parse JSON response for successful requests
        const result = await response.json()
        console.log(`📋 [${pollRequestId}] FRONTEND: Poll response:`, result)

        if (result.status === 'completed' && result.videoUrl) {
          // Video generation completed successfully
          clearInterval(progressInterval)
          setGenerationProgress(100)

          const finalVideo: GeneratedVideo = {
            id: generationId,
            url: result.videoUrl,
            prompt: prompt.trim(),
            aspectRatio: selectedAspectRatio,
            model: selectedModel,
            style: selectedStyle,
            quality: selectedQuality,
            resolution: selectedResolution,
            duration: duration,
            createdAt: new Date().toISOString(),
            isLoading: false
          }

          setCurrentVideo(finalVideo)
          setGeneratedVideos(prev =>
            prev.map(video => video.id === tempVideoId ? finalVideo : video)
          )
          setIsGenerating(false)

          console.log(`✅ [${pollRequestId}] FRONTEND: Video generation completed successfully!`)

          // Refresh the gallery
          setTimeout(() => {
            loadUserVideos(false)
          }, 1000)

        } else if (result.status === 'failed') {
          // Video generation failed - clean up automatically
          clearInterval(progressInterval)
          setGenerationProgress(0)

          const errorMessage = result.error || 'Video generation failed'
          setVideoError(errorMessage)

          // 🧹 AUTOMATIC CLEANUP: Remove failed generation from UI instead of showing red error box
          setGeneratedVideos(prev =>
            prev.filter(video => video.id !== tempVideoId)
          )
          setIsGenerating(false)

          // 📝 Log error for debugging purposes (not shown to user in UI)
          console.error(`❌ [${pollRequestId}] FRONTEND: Video generation failed (auto-cleaned):`, {
            tempVideoId,
            error: errorMessage,
            timestamp: new Date().toISOString()
          })

          // 🔔 Show user-friendly notification instead of red error box
          addNotification({
            type: 'error',
            title: 'Video Generation Failed',
            message: 'The video generation was unsuccessful and has been automatically removed. Please try again with different settings.',
            duration: 5000,
            dismissible: true,
            uniqueKey: 'video-generation-failed'
          })

          // 🧹 Run cleanup after a short delay to clean up the failed generation from database
          setTimeout(() => {
            cleanupFailedGenerations()
          }, 2000)

        } else if (result.status === 'processing') {
          // Still processing, continue polling
          if (pollAttempts < maxPollAttempts) {
            setTimeout(pollForCompletion, 5000) // Poll every 5 seconds
          } else {
            // Timeout reached
            clearInterval(progressInterval)
            setGenerationProgress(0)
            setVideoError('Video generation timed out. Please try again.')
            setIsGenerating(false)

            console.error(`⏰ [${pollRequestId}] FRONTEND: Video generation timed out after ${maxPollAttempts} attempts`)
          }
        }

      } catch (error) {
        console.error(`❌ [${pollRequestId}] FRONTEND: Polling error:`, error)

        if (pollAttempts < maxPollAttempts) {
          // Retry on error
          setTimeout(pollForCompletion, 5000)
        } else {
          // Give up after max attempts
          clearInterval(progressInterval)
          setGenerationProgress(0)
          setVideoError('Failed to check video generation status. Please try again.')
          setIsGenerating(false)
        }
      }
    }

    // Start polling after a short delay
    setTimeout(pollForCompletion, 2000)
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        const base64Data = result.split(',')[1]
        resolve(base64Data)
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }








  // Authentication is now handled by Clerk middleware
  // Component will only render if user is authenticated

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Sidebar - Previous Generations */}
      <div className="w-16 bg-background border-r border-border flex flex-col items-center py-4 space-y-2 overflow-y-auto scrollbar-none">
        <button
          onClick={() => window.location.href = '/video/gallery'}
          className="w-12 h-12 border-2 border-dashed rounded-lg flex items-center justify-center transition-all duration-200 relative border-muted hover:border-muted-foreground text-muted-foreground hover:text-foreground"
          title={`Open gallery (${generatedVideos.filter(v => !v.error && !v.isLoading).length} videos)`}
        >
          <Plus className="w-5 h-5" />
          {generatedVideos.filter(v => !v.error && !v.isLoading).length > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
              {generatedVideos.filter(v => !v.error && !v.isLoading).length > 99 ? '99+' : generatedVideos.filter(v => !v.error && !v.isLoading).length}
            </div>
          )}
        </button>

        {/* Show more videos in sidebar */}
        <div className="flex flex-col space-y-2 w-full items-center">
          {generatedVideos
            .filter(video => !video.error && !video.isLoading) // 🧹 Only show successful videos
            .slice(0, 12)
            .map((video, index) => (
            <div
              key={video.id}
              className={`w-12 h-12 rounded-lg overflow-hidden border transition-all duration-200 cursor-pointer relative group ${
                currentVideo?.id === video.id
                  ? 'border-primary shadow-md'
                  : 'border-border hover:border-primary/50 hover:shadow-sm'
              }`}
              onClick={() => setCurrentVideo(video)} // 🧹 Simplified since we only show successful videos
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* 🧹 Removed error state rendering since failed videos are filtered out */}
              <div className="w-full h-full relative overflow-hidden group-hover:scale-105 transition-transform duration-200">
                <video
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  onError={() => {
                    console.error('🎬 SIDEBAR: Error loading video preview:', video.id)
                    handleVideoError(video.id)
                  }}
                  onLoadedData={() => {
                    console.log('🎬 SIDEBAR: Video preview loaded:', video.id)
                    handleVideoLoad(video.id)
                  }}
                >
                  <source src={getProxiedVideoUrl(video.id)} type="video/mp4" />
                </video>
                {/* Subtle overlay to indicate it's clickable */}
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <div className="w-4 h-4 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <PlayIcon className="w-2 h-2 text-white" />
                  </div>
                </div>
              </div>

              {currentVideo?.id === video.id && (
                <div className="absolute inset-0 border-2 border-primary rounded-lg bg-primary/10"></div>
              )}
            </div>
          ))}

          {/* Show more indicator */}
          {generatedVideos.length > 12 && (
            <button
              onClick={() => window.location.href = '/video/gallery'}
              className="w-12 h-8 bg-muted/50 hover:bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground hover:text-foreground transition-colors"
              title={`View all ${generatedVideos.length} videos`}
            >
              +{generatedVideos.length - 12}
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation would go here */}

        {/* Center Content */}
        <div className="flex-1 flex items-center justify-center relative">
          <div className="w-full max-w-2xl px-8">
            {/* Main Video Generation Interface */}
            <div className="text-center">
              {/* Icon and Title */}
              <div className="flex items-center justify-center mb-8">
                <PlayIcon className="w-8 h-8 text-foreground mr-3" />
                <h1 className="text-4xl font-semibold text-foreground">Video</h1>
              </div>

              {/* Main Prompt Input */}
              <div className="mb-6">
                <div
                  className="rounded-3xl border border-border bg-card p-2 shadow-lg transition-all duration-300"
                >
                  {/* File Upload Tabs */}
                  {(files.length > 0 || startFrameFile || endFrameFile) && !isRecording && (
                    <div className="flex space-x-2 p-2 pb-1 transition-all duration-300">
                      {/* Reference File Tab */}
                      <button
                        onClick={() => setActiveTab('reference')}
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${
                          activeTab === 'reference'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        Reference {files.length > 0 && '✓'}
                      </button>

                      {/* Start Frame Tab */}
                      <button
                        onClick={() => setActiveTab('start')}
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${
                          activeTab === 'start'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        Start {startFrameFile && '✓'}
                      </button>

                      {/* End Frame Tab */}
                      <button
                        onClick={() => setActiveTab('end')}
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${
                          activeTab === 'end'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        End {endFrameFile && '✓'}
                      </button>
                    </div>
                  )}

                  {/* File Previews */}
                  {activeTab === 'reference' && files.length > 0 && !isRecording && (
                    <div className="flex flex-wrap gap-2 p-0 pb-1 transition-all duration-300">
                      {files.map((file, index) => (
                        <div key={index} className="relative group">
                          {file.type.startsWith("image/") && filePreviews[file.name] && (
                            <div className="w-16 h-16 rounded-xl overflow-hidden cursor-pointer transition-all duration-300">
                              <img
                                src={filePreviews[file.name]}
                                alt={file.name}
                                className="h-full w-full object-cover"
                              />
                              <button
                                onClick={() => {
                                  setFiles([])
                                  setFilePreviews({})
                                }}
                                className="absolute top-1 right-1 rounded-full bg-black/70 p-0.5 opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3 text-white" />
                              </button>
                            </div>
                          )}
                          {file.type.startsWith("video/") && (
                            <div className="w-16 h-16 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 bg-gradient-to-br from-orange-100 to-yellow-100 flex items-center justify-center">
                              <PlayIcon className="w-6 h-6 text-orange-600" />
                              <button
                                onClick={() => {
                                  setFiles([])
                                  setFilePreviews({})
                                }}
                                className="absolute top-1 right-1 rounded-full bg-black/70 p-0.5 opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3 text-white" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Start Frame Preview */}
                  {activeTab === 'start' && startFrameFile && !isRecording && (
                    <div className="flex flex-wrap gap-2 p-0 pb-1 transition-all duration-300">
                      <div className="relative group">
                        <div className="w-16 h-16 rounded-xl overflow-hidden cursor-pointer transition-all duration-300">
                          <img
                            src={URL.createObjectURL(startFrameFile)}
                            alt="Start frame"
                            className="h-full w-full object-cover"
                          />
                          <button
                            onClick={() => setStartFrameFile(null)}
                            className="absolute top-1 right-1 rounded-full bg-black/70 p-0.5 opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3 text-white" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* End Frame Preview */}
                  {activeTab === 'end' && endFrameFile && !isRecording && (
                    <div className="flex flex-wrap gap-2 p-0 pb-1 transition-all duration-300">
                      <div className="relative group">
                        <div className="w-16 h-16 rounded-xl overflow-hidden cursor-pointer transition-all duration-300">
                          <img
                            src={URL.createObjectURL(endFrameFile)}
                            alt="End frame"
                            className="h-full w-full object-cover"
                          />
                          <button
                            onClick={() => setEndFrameFile(null)}
                            className="absolute top-1 right-1 rounded-full bg-black/70 p-0.5 opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3 text-white" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className={`relative transition-all duration-300 ${isRecording ? "h-0 overflow-hidden opacity-0" : "opacity-100"}`}>
                    <textarea
                      ref={textareaRef}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe a video and click generate..."
                      className={`flex w-full rounded-md border-none bg-transparent px-3 py-2.5 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] resize-none transition-all duration-300 ${
                        isEnhancing ? 'border-2 border-purple-200 dark:border-purple-800 animate-pulse' : ''
                      }`}
                      rows={1}
                      disabled={isEnhancing}
                    />
                    {isEnhancing && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-md">
                        <div className="flex items-center space-x-2 text-sm text-purple-600 dark:text-purple-400">
                          <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                          <span>Enhancing...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 p-0 pt-2">
                    <div className={`flex items-center gap-1 transition-opacity duration-300 ${isRecording ? "opacity-0 invisible h-0" : "opacity-100 visible"}`}>
                      <button
                        onClick={handleImageUpload}
                        className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                          isRecording || !supportsImageToVideo()
                            ? 'text-muted-foreground/50 cursor-not-allowed'
                            : 'text-muted-foreground cursor-pointer hover:bg-accent hover:text-accent-foreground'
                        }`}
                        disabled={isRecording || !supportsImageToVideo()}
                        title={!supportsImageToVideo() ? `${selectedModel} does not support image-to-video generation` : 'Upload image or video'}
                      >
                        <Paperclip className="h-5 w-5 transition-colors" />
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          onChange={handleFileChange}
                          accept="image/*,video/*"
                        />
                      </button>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Enhance Prompt Button */}
                      <button
                        onClick={handleEnhancePrompt}
                        className="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 hover:bg-purple-100 dark:hover:bg-purple-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        type="button"
                        disabled={
                          isEnhancing ||
                          isGenerating ||
                          isRecording ||
                          !prompt.trim() ||
                          prompt.trim().length < 3
                        }
                        title={
                          isEnhancing ? "Enhancing prompt..." :
                          !prompt.trim() || prompt.trim().length < 3 ? "Enter at least 3 characters to enhance" :
                          "Enhance prompt with AI"
                        }
                      >
                        {isEnhancing ? (
                          <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <span className="text-purple-600 dark:text-purple-400 text-sm">✨</span>
                        )}
                      </button>

                      {/* Generate/Send Button */}
                      <button
                        onClick={() => {
                          if (isRecording) handleStopRecording();
                          else if (hasContent) handleGenerate();
                          else handleStartRecording();
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                        type="button"
                        disabled={isGenerating || isEnhancing || !effectivelySignedIn}
                        title={!effectivelySignedIn ? 'Please sign in to generate videos' : ''}
                      >
                        {isGenerating ? (
                          <div className="relative">
                            <div
                              className="w-4 h-4 bg-primary rounded-sm animate-spin"
                              style={{
                                animationDuration: "1s",
                                animationTimingFunction: "linear"
                              }}
                            />
                          </div>
                        ) : isRecording ? (
                          <div className="w-4 h-4 bg-destructive rounded-sm animate-pulse" />
                        ) : (
                          <CornerRightUp
                            className={`w-4 h-4 transition-all duration-200 ${
                              hasContent
                                ? "text-primary scale-110"
                                : "text-muted-foreground scale-100"
                            }`}
                          />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Aspect Ratio Dropdown */}
                <div className="flex items-center justify-center space-x-4 mb-4">
                  <div className="relative" ref={aspectRatioDropdownRef}>
                    <span className="text-sm text-muted-foreground mr-2">Aspect Ratio:</span>
                    <button
                      onClick={() => setShowAspectRatioPopover(!showAspectRatioPopover)}
                      className="px-3 py-1.5 text-sm bg-muted text-muted-foreground hover:bg-muted/80 rounded-md transition-colors flex items-center space-x-1 min-w-[140px] justify-between"
                      disabled={isGenerating}
                    >
                      <span>{aspectRatios.find(r => r.ratio === selectedAspectRatio)?.label || '16:9 (Landscape)'}</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showAspectRatioPopover && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-background border border-border rounded-md shadow-lg z-50">
                        {aspectRatios.map((ratio) => (
                          <button
                            key={ratio.id}
                            onClick={() => {
                              setSelectedAspectRatio(ratio.ratio)
                              setShowAspectRatioPopover(false)
                            }}
                            className={`w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors first:rounded-t-md last:rounded-b-md ${
                              selectedAspectRatio === ratio.ratio ? 'bg-muted text-foreground' : 'text-muted-foreground'
                            }`}
                            disabled={isGenerating}
                          >
                            {ratio.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Resolution Dropdown */}
                  <div className="relative" ref={resolutionDropdownRef}>
                    <span className="text-sm text-muted-foreground mr-2">Resolution:</span>
                    <button
                      onClick={() => setShowResolutionDropdown(!showResolutionDropdown)}
                      className="px-3 py-1.5 text-sm bg-muted text-muted-foreground hover:bg-muted/80 rounded-md transition-colors flex items-center space-x-1 min-w-[120px] justify-between"
                      disabled={isGenerating}
                    >
                      <span>{getAvailableResolutions().find(r => r.value === selectedResolution)?.label || selectedResolution}</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showResolutionDropdown && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-background border border-border rounded-md shadow-lg z-50">
                        {getAvailableResolutions().map((resolution) => (
                          <button
                            key={resolution.value}
                            onClick={() => {
                              setSelectedResolution(resolution.value)
                              setShowResolutionDropdown(false)
                            }}
                            className={`w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors first:rounded-t-md last:rounded-b-md ${
                              selectedResolution === resolution.value ? 'bg-muted text-foreground' : 'text-muted-foreground'
                            }`}
                            disabled={isGenerating}
                          >
                            {resolution.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Duration Dropdown */}
                  <div className="relative" ref={durationDropdownRef}>
                    <span className="text-sm text-muted-foreground mr-2">Duration:</span>
                    <button
                      onClick={() => setShowDurationDropdown(!showDurationDropdown)}
                      className="px-3 py-1.5 text-sm bg-muted text-muted-foreground hover:bg-muted/80 rounded-md transition-colors flex items-center space-x-1 min-w-[120px] justify-between"
                      disabled={isGenerating}
                    >
                      <span>{duration} seconds</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showDurationDropdown && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-background border border-border rounded-md shadow-lg z-50">
                        {getAvailableDurations().map((durationOption) => (
                          <button
                            key={durationOption.value}
                            onClick={() => {
                              setDuration(durationOption.value)
                              setShowDurationDropdown(false)
                            }}
                            className={`w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors first:rounded-t-md last:rounded-b-md ${
                              duration === durationOption.value ? 'bg-muted text-foreground' : 'text-muted-foreground'
                            }`}
                            disabled={isGenerating}
                          >
                            <div>
                              <div className="font-medium">{durationOption.label}</div>
                              <div className="text-xs text-muted-foreground">{durationOption.description}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Video Display Area */}
              {currentVideo && (
                <div className="mt-8">
                  <div className="bg-card rounded-lg border border-border p-6">
                    {currentVideo.isLoading ? (
                      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Generating video...</p>
                          {generationProgress > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">{Math.round(generationProgress)}% complete</p>
                          )}
                        </div>
                      </div>
                    ) : currentVideo.error ? (
                      <div className="aspect-video bg-destructive/10 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <svg className="w-8 h-8 text-destructive mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-sm text-destructive">Failed to generate video</p>
                          <p className="text-xs text-muted-foreground mt-1">{currentVideo.error}</p>
                        </div>
                      </div>
                    ) : currentVideo.url ? (
                      <div className="space-y-4">
                        <video
                          src={getProxiedVideoUrl(currentVideo.id)}
                          controls
                          className="w-full aspect-video rounded-lg"
                          onError={(e) => {
                            console.error('🎬 VIDEO PLAYER: Error loading video:', currentVideo.id, e)
                            handleVideoError(currentVideo.id)
                          }}
                          onLoadedData={(e) => {
                            console.log('🎬 VIDEO PLAYER: Video loaded successfully:', currentVideo.id)
                            handleVideoLoad(currentVideo.id)
                          }}
                        >
                          Your browser does not support the video tag.
                        </video>
                        <div className="text-sm text-muted-foreground">
                          <p className="font-medium">{currentVideo.prompt}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span>{currentVideo.model}</span>
                            <span>{currentVideo.aspectRatio}</span>
                            <span>{currentVideo.resolution}</span>
                            <span>{currentVideo.duration}s</span>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Left - Model Selector */}
        <div className="absolute bottom-6 left-20">
          <div className="relative" ref={modelSelectorRef}>
            <button
              onClick={() => setShowModelSelector(!showModelSelector)}
              className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors bg-card border border-border rounded-lg px-3 py-2"
            >
              <span>Model: {selectedModel}</span>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                <path d="m4.5 6 3 3 3-3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {showModelSelector && (
              <div className="absolute bottom-full left-0 mb-2 bg-popover border border-border rounded-lg shadow-lg w-80 max-h-96 overflow-y-auto z-50">
                <div className="p-4">
                  {isLoadingModels ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span className="ml-2 text-sm text-muted-foreground">Loading models...</span>
                    </div>
                  ) : aiModels.length > 0 ? (
                    <>
                      {aiModels.map((model) => (
                        <button
                          key={model.id}
                          onClick={() => {
                            setSelectedModel(model.name)
                            setShowModelSelector(false)
                          }}
                          className="w-full text-left p-3 hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-foreground">{model.name}</span>
                            {model.isNew && (
                              <span className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 text-xs px-2 py-1 rounded-full">Featured</span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{model.description}</p>
                          {model.name.includes('Veo 3') && (
                            <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded border border-amber-200 dark:border-amber-800">
                              ⚠️ Requires allowlist access. Will fallback to Veo 2.0 if not available.
                            </div>
                          )}
                          {model.tags && model.tags.length > 0 && (
                            <div className="flex space-x-2 mb-2">
                              {model.tags.map((tag, index) => (
                                <span key={index} className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          {(model as any).pricing_credits && (
                            <div className="text-xs text-muted-foreground">
                              {(model as any).pricing_credits} credits per generation
                            </div>
                          )}
                        </button>
                      ))}
                      <div className="border-t border-border pt-3 mt-3">
                        <div className="text-xs text-muted-foreground text-center">
                          Powered by Google Vertex AI
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No models available</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>



      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*,video/*"
        onChange={handleFileChange}
      />
      <input
        ref={startFrameInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleStartFrameChange}
      />
      <input
        ref={endFrameInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleEndFrameChange}
      />


    </div>
  )
}
