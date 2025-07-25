'use client'

import { useState, useRef, useEffect } from 'react'
import {
  ImageIcon,
  PaintbrushIcon,
  Expand,
  X,
  Plus,
  Paperclip,
  Mic,
  CornerRightUp
} from 'lucide-react'
import { PlayIcon } from '@heroicons/react/24/outline'
import { useToast } from '@/components/ui/Toast'
import { StyleSelector, DEFAULT_STYLES } from '@/components/ui/StyleSelector'
import { ImageToVideoConverter } from '@/components/video/ImageToVideoConverter'

interface StyleOption {
  id: string
  name: string
  image: string
  category: string
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
}

interface GeneratedImage {
  id: string
  url: string
  prompt: string
  aspectRatio: string
  model: string
  style?: string
  quality?: string
  createdAt: string
  isLoading?: boolean
  error?: string
  usingProxy?: boolean
}

export function ImageGeneratorInterface() {
  const { addToast } = useToast()

  const [prompt, setPrompt] = useState('')
  const [showStyleModal, setShowStyleModal] = useState(false)
  const [showAspectRatioPopover, setShowAspectRatioPopover] = useState(false)
  const [showModelSelector, setShowModelSelector] = useState(false)
  const [showStyleTooltip, setShowStyleTooltip] = useState(false)
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('1:1')
  const [selectedModel, setSelectedModel] = useState('Imagen 4.0')
  const [selectedStyle, setSelectedStyle] = useState('realistic')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [filePreviews, setFilePreviews] = useState<{ [key: string]: string }>({})
  const [aiModels, setAiModels] = useState<AIModel[]>([])
  const [isLoadingModels, setIsLoadingModels] = useState(true)

  // Image editing state
  const [isEditingMode, setIsEditingMode] = useState(false)
  const [editingImage, setEditingImage] = useState<File | null>(null)
  const [editingImagePreview, setEditingImagePreview] = useState<string | null>(null)
  const [editInstructions, setEditInstructions] = useState('')



  // Video generation state
  const [showVideoConverter, setShowVideoConverter] = useState(false)
  const [selectedImageForVideo, setSelectedImageForVideo] = useState<GeneratedImage | null>(null)

  // New state for image display and management
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const [showGallery, setShowGallery] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [isLoadingGallery, setIsLoadingGallery] = useState(false)
  // Download functionality removed

  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const aspectRatios: AspectRatio[] = [
    { id: '1:1', label: '1:1', ratio: '1:1', width: 1, height: 1 },
    { id: '16:9', label: '16:9', ratio: '16:9', width: 16, height: 9 },
    { id: '9:16', label: '9:16', ratio: '9:16', width: 9, height: 16 },
    { id: '4:3', label: '4:3', ratio: '4:3', width: 4, height: 3 },
  ]

  // Load AI models from API
  useEffect(() => {
    const loadAIModels = async () => {
      try {
        setIsLoadingModels(true)
        const response = await fetch('/api/ai-models?type=image')
        if (response.ok) {
          const models = await response.json()
          const transformedModels = models.map((model: any) => ({
            id: model.id,
            name: model.display_name,
            description: model.description,
            isNew: model.is_featured,
            tags: model.capabilities?.textToImage ? ['Image'] : [],
            provider: model.provider,
            pricing_credits: model.pricing_credits
          }))
          setAiModels(transformedModels)
          if (transformedModels.length > 0) {
            setSelectedModel(transformedModels[0].name)
          }
        } else {
          console.error('Failed to load AI models')
          // Fallback to default models if API fails
          setAiModels([
            { id: 'imagen-4.0-generate-preview-06-06', name: 'Imagen 4.0', description: 'Google\'s latest Imagen 4.0 model with enhanced quality', isNew: true, tags: ['Image'] }
          ])
          setSelectedModel('Imagen 4.0')
        }
      } catch (error) {
        console.error('Error loading AI models:', error)
        // Fallback to default models if API fails
        setAiModels([
          { id: 'imagen-4.0-generate-preview-06-06', name: 'Imagen 4.0', description: 'Google\'s latest Imagen 4.0 model with enhanced quality', isNew: true, tags: ['Image'] }
        ])
        setSelectedModel('Imagen 4.0')
      } finally {
        setIsLoadingModels(false)
      }
    }

    loadAIModels()
  }, [])

  // Load user's previous images
  const loadUserImages = async (showLoading = false) => {
    if (showLoading) setIsLoadingGallery(true)

    try {
      console.log('🔄 Loading user images...')
      const response = await fetch('/api/user/images?limit=50&type=image') // Only load generated images, not upscaled

      if (response.ok) {
        const data = await response.json()
        console.log('📸 API Response:', data)

        if (data.success && data.images && Array.isArray(data.images)) {
          const userImages: GeneratedImage[] = data.images.map((img: any) => ({
            id: img.id,
            url: `/api/images/proxy?id=${img.id}`, // Always use proxy URL to avoid expired signed URLs
            prompt: img.prompt || 'No prompt available',
            aspectRatio: img.aspectRatio || '1:1',
            model: img.model || 'Unknown',
            style: img.style || 'realistic',
            quality: img.quality || 'standard',
            createdAt: img.createdAt,
            isLoading: false
          }))

          // Filter out any images without valid URLs
          const validImages = userImages.filter(img => img.url && img.url.trim() !== '')

          console.log('📸 Sample image data:', userImages.slice(0, 2))
          console.log('📸 Valid images:', validImages.length, 'out of', userImages.length)

          setGeneratedImages(validImages)
          console.log(`📸 Loaded ${validImages.length} valid images out of ${userImages.length} total`)
        } else {
          console.log('📸 No images found or invalid response structure')
          setGeneratedImages([])
        }
      } else if (response.status === 401) {
        console.log('🔐 User not authenticated')
        setGeneratedImages([])
      } else {
        console.error('❌ Failed to load user images:', response.status, response.statusText)
        setGeneratedImages([])
      }
    } catch (error) {
      console.error('💥 Error loading user images:', error)
      setGeneratedImages([])
    } finally {
      if (showLoading) setIsLoadingGallery(false)
    }
  }

  useEffect(() => {
    console.log('🔄 ImageGeneratorInterface mounted, loading user images...')
    loadUserImages()
  }, [])

  const styleOptions: StyleOption[] = [
    { id: '1', name: 'Create SVG', image: 'https://picsum.photos/150/150?random=1', category: 'Community' },
    { id: '2', name: 'Fantasy Spandex P...', image: 'https://picsum.photos/150/150?random=2', category: 'Community' },
    { id: '3', name: 'Chinese Waterco...', image: 'https://picsum.photos/150/150?random=3', category: 'Community' },
    { id: '4', name: 'Minimalist Architec...', image: 'https://picsum.photos/150/150?random=4', category: 'Community' },
    { id: '5', name: 'Blue Frost', image: 'https://picsum.photos/150/150?random=5', category: 'Mine' },
    { id: '6', name: 'Abstract Blue Artis...', image: 'https://picsum.photos/150/150?random=6', category: 'Props' },
    { id: '7', name: 'Aurora 2025', image: 'https://picsum.photos/150/150?random=7', category: 'Featured' },
    { id: '8', name: 'Chinese Waterco...', image: 'https://picsum.photos/150/150?random=8', category: 'Featured' },
    { id: '9', name: 'Minimalist Architec...', image: 'https://picsum.photos/150/150?random=9', category: 'Featured' },
  ]

  const previousGenerations = [
    'https://picsum.photos/60/60?random=10',
    'https://picsum.photos/60/60?random=11',
    'https://picsum.photos/60/60?random=12',
    'https://picsum.photos/60/60?random=13',
    'https://picsum.photos/60/60?random=14',
    'https://picsum.photos/60/60?random=15',
    'https://picsum.photos/60/60?random=16',
    'https://picsum.photos/60/60?random=17',
  ]

  // Auto-resize textarea
  useEffect(() => {
    if (!textareaRef.current) return
    textareaRef.current.style.height = 'auto'
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
  }, [prompt])

  const handleGenerate = async () => {
    // Validate prompt length (API requires minimum 3 characters)
    if (!prompt.trim() || prompt.trim().length < 3) {
      console.log('🚫 Generation blocked: Prompt must be at least 3 characters')
      setImageError('Please enter a prompt with at least 3 characters')
      return
    }

    // Validate prompt length (API has maximum 1000 characters)
    if (prompt.trim().length > 1000) {
      console.log('🚫 Generation blocked: Prompt too long')
      setImageError('Prompt must be less than 1000 characters')
      return
    }

    const requestId = `frontend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    console.log(`🚀 [${requestId}] FRONTEND: Starting image generation`)
    console.log(`📝 [${requestId}] FRONTEND: Generation parameters:`, {
      prompt: prompt.trim(),
      selectedModel,
      selectedAspectRatio,
      promptLength: prompt.trim().length,
      hasFiles: files.length > 0
    })

    // Clear previous errors and reset progress
    setImageError(null)
    setGenerationProgress(0)
    setIsGenerating(true)

    // Create a temporary image entry to show loading state
    const tempImageId = `temp_${Date.now()}`
    const tempImage: GeneratedImage = {
      id: tempImageId,
      url: '',
      prompt: prompt.trim(),
      aspectRatio: selectedAspectRatio,
      model: selectedModel,
      style: selectedStyle,
      quality: 'standard',
      createdAt: new Date().toISOString(),
      isLoading: true
    }

    setCurrentImage(tempImage)
    setGeneratedImages(prev => [tempImage, ...prev])

    // Simulate progress during generation with different timing for image editing
    const isImageEditing = files.length > 0 && selectedModel.includes('Flux Kontext Pro')
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) return prev
        // Slower progress for image editing (can take 3+ minutes)
        const increment = isImageEditing
          ? Math.random() * 5 + 2  // Slower: 2-7% increments for editing
          : Math.random() * 10     // Normal: 0-10% increments for generation
        return prev + increment
      })
    }, isImageEditing ? 2000 : 1000) // Slower updates for editing

    if (isImageEditing) {
      console.log(`🎨 [${requestId}] FRONTEND: Image editing mode detected - using extended timeout and slower progress`)
    }

    try {
      // Find the selected model data
      const selectedModelData = aiModels.find(model => model.name === selectedModel)
      console.log(`🤖 [${requestId}] FRONTEND: Selected model data:`, selectedModelData)

      // Process uploaded files to base64 if any
      let referenceImageBase64: string | undefined = undefined
      if (files.length > 0) {
        console.log(`📁 [${requestId}] FRONTEND: Processing uploaded reference image...`)
        const file = files[0] // Use the first uploaded file as reference

        try {
          referenceImageBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => {
              const result = reader.result as string
              // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
              const base64Data = result.split(',')[1]
              resolve(base64Data)
            }
            reader.onerror = () => reject(new Error('Failed to read file'))
            reader.readAsDataURL(file)
          })

          console.log(`✅ [${requestId}] FRONTEND: Reference image converted to base64:`, {
            fileName: file.name,
            fileSize: file.size,
            base64Length: referenceImageBase64.length
          })
        } catch (error) {
          console.error(`❌ [${requestId}] FRONTEND: Failed to process reference image:`, error)
          addToast({
            type: 'error',
            title: 'File Processing Error',
            description: 'Failed to process the uploaded reference image',
            duration: 5000
          })
          throw new Error('Failed to process reference image')
        }
      }

      // Validate aspect ratio
      const validAspectRatios = ['1:1', '16:9', '9:16', '4:3', '3:4']
      if (!validAspectRatios.includes(selectedAspectRatio)) {
        console.error(`❌ [${requestId}] FRONTEND: Invalid aspect ratio: ${selectedAspectRatio}`)
        throw new Error('Invalid aspect ratio selected')
      }

      // Validate model selection
      if (!selectedModel || selectedModel.trim() === '') {
        console.error(`❌ [${requestId}] FRONTEND: No model selected`)
        throw new Error('Please select a model')
      }

      const requestPayload = {
        prompt: prompt.trim(),
        aspectRatio: selectedAspectRatio,
        style: selectedStyle,
        quality: 'standard',
        guidanceScale: 7,
        model: selectedModel,
        ...(referenceImageBase64 && { referenceImage: referenceImageBase64 })
      }

      console.log(`📤 [${requestId}] FRONTEND: Sending request to /api/generate/image`)
      console.log(`📤 [${requestId}] FRONTEND: Request payload:`, requestPayload)

      const startTime = Date.now()

      // Create AbortController for timeout handling
      // Use longer timeout for image editing operations (BFL can take 3+ minutes)
      const isImageEditing = files.length > 0 && selectedModel.includes('Flux Kontext Pro')
      const timeoutDuration = isImageEditing ? 300000 : 60000 // 5 minutes for editing, 1 minute for generation
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeoutDuration)

      console.log(`⏱️ [${requestId}] FRONTEND: Using ${timeoutDuration/1000}s timeout (${isImageEditing ? 'image editing' : 'generation'} mode)`)

      const response = await fetch('/api/generate/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      const endTime = Date.now()

      console.log(`📥 [${requestId}] FRONTEND: Response received in ${endTime - startTime}ms`)
      console.log(`📥 [${requestId}] FRONTEND: Response status: ${response.status} ${response.statusText}`)
      console.log(`📥 [${requestId}] FRONTEND: Response headers:`, Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch (parseError) {
          console.error(`❌ [${requestId}] FRONTEND: Failed to parse error response:`, parseError)
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        console.error(`❌ [${requestId}] FRONTEND: API request failed:`, errorData)

        // Handle validation errors with more specific messages
        if (errorData.details && Array.isArray(errorData.details)) {
          const validationErrors = errorData.details.map((detail: any) => detail.message).join(', ')
          throw new Error(`Validation error: ${validationErrors}`)
        }

        throw new Error(errorData.error || 'Failed to generate image')
      }

      const result = await response.json()
      console.log(`📋 [${requestId}] FRONTEND: Full response data:`, result)

      if (result.success) {
        console.log(`✅ [${requestId}] FRONTEND: Image generated successfully!`)
        console.log(`🖼️ [${requestId}] FRONTEND: Image URL:`, result.imageUrl)
        console.log(`💰 [${requestId}] FRONTEND: Credits used:`, result.creditsUsed)
        console.log(`💳 [${requestId}] FRONTEND: Remaining credits:`, result.remainingCredits)

        clearInterval(progressInterval)
        setGenerationProgress(100)

        if (result.imageUrl) {
          console.log(`🎨 [${requestId}] FRONTEND: Image ready for display at: ${result.imageUrl}`)

          // Create the final image object
          const finalImage: GeneratedImage = {
            id: result.generation?.id || `img_${Date.now()}`,
            url: result.imageUrl,
            prompt: prompt.trim(),
            aspectRatio: selectedAspectRatio,
            model: selectedModel,
            style: selectedStyle,
            quality: 'standard',
            createdAt: new Date().toISOString(),
            isLoading: false
          }

          // Update the current image and replace the temp image in the list
          setCurrentImage(finalImage)
          setGeneratedImages(prev =>
            prev.map(img => img.id === tempImageId ? finalImage : img)
          )

          // Clear the prompt after successful generation
          setPrompt('')

          // Refresh the gallery to ensure we have the latest images
          setTimeout(() => {
            loadUserImages(false)
          }, 1000)

        } else {
          console.warn(`⚠️ [${requestId}] FRONTEND: No image URL in successful response`)
          throw new Error('No image URL received from server')
        }
      } else {
        console.error(`❌ [${requestId}] FRONTEND: Generation marked as failed:`, result.error)
        throw new Error(result.error || 'Generation failed')
      }

    } catch (error) {
      console.error(`💥 [${requestId}] FRONTEND: Generation error:`, error)
      console.error(`💥 [${requestId}] FRONTEND: Error details:`, {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      })

      clearInterval(progressInterval)
      setGenerationProgress(0)

      // Handle different types of errors
      let errorMessage = 'Unknown error occurred'
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          const isImageEditing = files.length > 0 && selectedModel.includes('Flux Kontext Pro')
          if (isImageEditing) {
            errorMessage = 'Image editing is taking longer than expected. Please check your gallery in a few minutes as the process may still be completing in the background.'

            // Set up a delayed gallery refresh for image editing timeouts
            setTimeout(() => {
              console.log(`🔄 [${requestId}] FRONTEND: Delayed gallery refresh after image editing timeout`)
              loadUserImages(false)
            }, 60000) // Check again in 1 minute

            setTimeout(() => {
              console.log(`🔄 [${requestId}] FRONTEND: Final gallery refresh after image editing timeout`)
              loadUserImages(false)
            }, 180000) // Check again in 3 minutes
          } else {
            errorMessage = 'Request timed out. Please try again.'
          }
        } else if (error.message === 'Failed to fetch') {
          errorMessage = 'Network error. Please check your connection and try again.'
        } else {
          errorMessage = error.message
        }
      }

      setImageError(errorMessage)

      // Update the temp image with error state
      setGeneratedImages(prev =>
        prev.map(img =>
          img.id === tempImageId
            ? { ...img, isLoading: false, error: errorMessage }
            : img
        )
      )

      // Remove current image if it was the temp one
      if (currentImage?.id === tempImageId) {
        setCurrentImage(null)
      }
    } finally {
      console.log(`🏁 [${requestId}] FRONTEND: Generation process completed`)
      setIsGenerating(false)
    }
  }

  const handleImageUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const isImageFile = (file: File) => file.type.startsWith('image/')

  const processFile = (file: File) => {
    if (!isImageFile(file)) {
      console.log('Only image files are allowed')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      console.log('File too large (max 10MB)')
      return
    }
    setFiles([file])
    const reader = new FileReader()
    reader.onload = (e) => {
      setFilePreviews({ [file.name]: e.target?.result as string })
    }
    reader.readAsDataURL(file)
  }



  const handleGenerateVideoFromImage = (image: GeneratedImage) => {
    setSelectedImageForVideo(image)
    setShowVideoConverter(true)
  }

  const handleVideoGenerated = (video: any) => {
    setShowVideoConverter(false)
    setSelectedImageForVideo(null)
    addToast({
      type: 'success',
      title: 'Video Generated!',
      description: 'Your video has been created successfully from the image',
      duration: 4000
    })
  }

  const handleCloseVideoConverter = () => {
    setShowVideoConverter(false)
    setSelectedImageForVideo(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const files = Array.from(e.dataTransfer.files)
    const imageFiles = files.filter((file) => isImageFile(file))
    if (imageFiles.length > 0) processFile(imageFiles[0])
  }

  const handleRemoveFile = () => {
    setFiles([])
    setFilePreviews({})
  }



  const handleStartRecording = () => {
    setIsRecording(true)
    console.log('Started recording')
  }

  const handleStopRecording = () => {
    setIsRecording(false)
    console.log('Stopped recording')
  }

  const handleEnhancePrompt = async () => {
    const requestId = `enhance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    console.log(`✨ [${requestId}] PROMPT ENHANCEMENT STARTED`)
    console.log(`📝 [${requestId}] Original prompt:`, prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''))

    // Validate prompt before enhancement
    if (!prompt.trim() || prompt.trim().length < 3) {
      console.log(`❌ [${requestId}] Enhancement blocked: Prompt too short`)
      setImageError('Please enter a prompt with at least 3 characters before enhancing')
      return
    }

    if (prompt.trim().length > 1000) {
      console.log(`❌ [${requestId}] Enhancement blocked: Prompt too long`)
      setImageError('Prompt is already at maximum length (1000 characters)')
      return
    }

    setIsEnhancing(true)
    setImageError(null)

    try {
      console.log(`📡 [${requestId}] Sending enhancement request...`)
      const startTime = Date.now()

      const response = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          context: 'image' // Specify this is for image generation
        })
      })

      const endTime = Date.now()
      console.log(`📡 [${requestId}] Enhancement response received in ${endTime - startTime}ms`)
      console.log(`📡 [${requestId}] Response status: ${response.status} ${response.statusText}`)

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error(`❌ [${requestId}] Failed to parse response:`, parseError)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      if (!response.ok) {
        console.error(`❌ [${requestId}] Enhancement API error:`, data)

        // Handle validation errors with more specific messages
        if (data.details && Array.isArray(data.details)) {
          const validationErrors = data.details.map((detail: any) => detail.message).join(', ')
          throw new Error(`Validation error: ${validationErrors}`)
        }

        throw new Error(data.error || 'Enhancement failed')
      }

      if (!data.success || !data.enhancedPrompt) {
        console.error(`❌ [${requestId}] Enhancement failed:`, data)
        throw new Error(data.error || 'No enhanced prompt received')
      }

      console.log(`✅ [${requestId}] Enhancement successful:`, {
        originalLength: data.originalLength,
        enhancedLength: data.enhancedLength,
        truncated: data.truncated,
        enhancedPreview: data.enhancedPrompt.substring(0, 100) + (data.enhancedPrompt.length > 100 ? '...' : '')
      })

      // Update the prompt with enhanced version
      setPrompt(data.enhancedPrompt)

      // Auto-resize textarea to fit enhanced content
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
      }

      // Show success message
      addToast({
        type: 'success',
        title: 'Prompt Enhanced!',
        description: data.truncated
          ? `Enhanced and optimized to ${data.enhancedLength} characters`
          : `Enhanced from ${data.originalLength} to ${data.enhancedLength} characters`,
        duration: 4000
      })

      console.log(`🎉 [${requestId}] PROMPT ENHANCEMENT COMPLETED SUCCESSFULLY!`)

    } catch (error) {
      console.error(`💥 [${requestId}] Enhancement error:`, error)
      console.error(`💥 [${requestId}] Error details:`, {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      })

      // Handle different types of errors
      let errorMessage = 'Enhancement service error'
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Enhancement timed out. Please try again.'
        } else if (error.message === 'Failed to fetch') {
          errorMessage = 'Network error. Please check your connection and try again.'
        } else if (error.message.includes('Validation error')) {
          errorMessage = error.message
        } else if (error.message.includes('Enhancement service')) {
          errorMessage = 'Enhancement service temporarily unavailable. Please try again later.'
        } else {
          errorMessage = error.message
        }
      }

      setImageError(errorMessage)

      addToast({
        type: 'error',
        title: 'Enhancement Failed',
        description: errorMessage,
        duration: 6000
      })
    } finally {
      console.log(`🏁 [${requestId}] Enhancement process completed`)
      setIsEnhancing(false)
    }
  }

  const hasContent = prompt.trim() !== '' || files.length > 0

  // Helper functions for image handling
  const handleImageClick = (image: GeneratedImage) => {
    setCurrentImage(image)
    setShowImageModal(true)
  }

  // Download functionality removed

  const handleImageLoad = (imageId: string) => {
    setGeneratedImages(prev =>
      prev.map(img =>
        img.id === imageId
          ? { ...img, isLoading: false, error: undefined }
          : img
      )
    )
  }

  const handleImageError = (imageId: string) => {
    console.error('❌ Image failed to load:', imageId)

    setGeneratedImages(prev =>
      prev.map(img =>
        img.id === imageId
          ? { ...img, isLoading: false, error: 'Failed to load image' }
          : img
      )
    )
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Sidebar - Previous Generations */}
      <div className="w-16 bg-background border-r border-border flex flex-col items-center py-4 space-y-2 overflow-y-auto scrollbar-none">
        <button
          onClick={() => setShowGallery(!showGallery)}
          className={`w-12 h-12 border-2 border-dashed rounded-lg flex items-center justify-center transition-all duration-200 relative ${
            showGallery
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-muted hover:border-muted-foreground text-muted-foreground hover:text-foreground'
          }`}
          title={showGallery ? 'Close gallery' : `Open gallery (${generatedImages.length} images)`}
        >
          {showGallery ? (
            <X className="w-5 h-5" />
          ) : (
            <Plus className="w-5 h-5" />
          )}
          {generatedImages.length > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
              {generatedImages.length > 99 ? '99+' : generatedImages.length}
            </div>
          )}
        </button>

        {/* Show more images in sidebar */}
        <div className="flex flex-col space-y-2 w-full items-center">
          {generatedImages.slice(0, 12).map((image, index) => (
            <div
              key={image.id}
              className={`w-12 h-12 rounded-lg overflow-hidden border transition-all duration-200 cursor-pointer relative group ${
                currentImage?.id === image.id
                  ? 'border-primary shadow-md'
                  : 'border-border hover:border-primary/50 hover:shadow-sm'
              }`}
              onClick={() => !image.isLoading && !image.error && setCurrentImage(image)}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {image.isLoading ? (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : image.error ? (
                <div className="w-full h-full bg-destructive/20 flex items-center justify-center">
                  <svg className="w-3 h-3 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              ) : (
                <img
                  src={image.url}
                  alt={image.prompt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  title={image.prompt}
                  loading="lazy"
                  onError={() => handleImageError(image.id)}
                  onLoad={() => handleImageLoad(image.id)}
                />
              )}

              {currentImage?.id === image.id && (
                <div className="absolute inset-0 border-2 border-primary rounded-lg bg-primary/10"></div>
              )}
            </div>
          ))}

          {/* Show more indicator */}
          {generatedImages.length > 12 && (
            <button
              onClick={() => setShowGallery(true)}
              className="w-12 h-8 bg-muted/50 hover:bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground hover:text-foreground transition-colors"
              title={`View all ${generatedImages.length} images`}
            >
              +{generatedImages.length - 12}
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
            {/* Main Image Generation Interface */}
            <div className="text-center">
              {/* Icon and Title */}
              <div className="flex items-center justify-center mb-8">
                <ImageIcon className="w-8 h-8 text-foreground mr-3" />
                <h1 className="text-4xl font-semibold text-foreground">Image</h1>
              </div>

              {/* Main Prompt Input */}
              <div className="mb-6">
                <div
                  className="rounded-3xl border border-border bg-card p-2 shadow-lg transition-all duration-300"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {files.length > 0 && !isRecording && (
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
                                onClick={() => handleRemoveFile()}
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

                  <div className={`relative transition-all duration-300 ${isRecording ? "h-0 overflow-hidden opacity-0" : "opacity-100"}`}>
                    <textarea
                      ref={textareaRef}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe an image and click generate..."
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

                  {isRecording && (
                    <div className="flex flex-col items-center justify-center w-full transition-all duration-300 py-3 opacity-100">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                        <span className="font-mono text-sm text-foreground/80">00:00</span>
                      </div>
                      <div className="w-full h-10 flex items-center justify-center gap-0.5 px-4">
                        {[...Array(32)].map((_, i) => (
                          <div
                            key={i}
                            className="w-0.5 rounded-full bg-foreground/50 animate-pulse"
                            style={{
                              height: `${Math.max(15, Math.random() * 100)}%`,
                              animationDelay: `${i * 0.05}s`,
                              animationDuration: `${0.5 + Math.random() * 0.5}s`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 p-0 pt-2">
                    <div className={`flex items-center gap-1 transition-opacity duration-300 ${isRecording ? "opacity-0 invisible h-0" : "opacity-100 visible"}`}>
                      <button
                        onClick={handleImageUpload}
                        className="flex h-8 w-8 text-muted-foreground cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-accent hover:text-accent-foreground"
                        disabled={isRecording}
                      >
                        <Paperclip className="h-5 w-5 transition-colors" />
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          onChange={handleFileChange}
                          accept="image/*"
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
                        disabled={isGenerating || isEnhancing}
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
              </div>



              {/* Generated Image Display Area */}
              {(currentImage || isGenerating || imageError) && (
                <div className="mb-8">
                  <div className="flex flex-col items-center">
                    {isGenerating && (
                      <div className="w-80 h-80 bg-muted rounded-lg flex flex-col items-center justify-center border border-border">
                        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {files.length > 0 && selectedModel.includes('Flux Kontext Pro')
                            ? 'Editing your image...'
                            : 'Generating your image...'}
                        </p>
                        {files.length > 0 && selectedModel.includes('Flux Kontext Pro') && (
                          <p className="text-xs text-muted-foreground/70 text-center px-4">
                            Image editing may take 2-5 minutes to complete
                          </p>
                        )}
                        <div className="w-64 bg-muted-foreground/20 rounded-full h-2 mb-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-500"
                            style={{ width: `${generationProgress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-muted-foreground">{Math.round(generationProgress)}% complete</p>
                      </div>
                    )}

                    {currentImage && !currentImage.isLoading && !currentImage.error && (
                      <div className="relative group">
                        <div className="w-80 h-80 rounded-lg overflow-hidden border border-border shadow-lg">
                          <img
                            src={currentImage.url}
                            alt={currentImage.prompt}
                            className="w-full h-full object-cover cursor-pointer transition-transform hover:scale-105"
                            onClick={() => handleImageClick(currentImage)}
                            onLoad={() => handleImageLoad(currentImage.id)}
                            onError={() => handleImageError(currentImage.id)}
                          />
                        </div>

                        {/* Download button removed */}

                        <div className="mt-3 text-center">
                          <p className="text-sm text-muted-foreground max-w-80 truncate">{currentImage.prompt}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {currentImage.model} • {currentImage.aspectRatio}
                          </p>

                          {/* Generate Video Button */}
                          <button
                            onClick={() => handleGenerateVideoFromImage(currentImage)}
                            className="mt-3 flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors mx-auto"
                          >
                            <PlayIcon className="w-4 h-4" />
                            <span>Generate Video</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {imageError && (
                      <div className="w-80 h-80 bg-destructive/10 border border-destructive/20 rounded-lg flex flex-col items-center justify-center">
                        <div className="text-destructive mb-2">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <p className="text-sm text-destructive text-center px-4">{imageError}</p>
                        <button
                          onClick={() => setImageError(null)}
                          className="mt-3 text-xs text-muted-foreground hover:text-foreground"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center space-x-6 text-sm">
                {/* Style Selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowStyleModal(true)}
                    disabled={isGenerating}
                    className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                    title="Choose style"
                  >
                    <span className="text-lg">{DEFAULT_STYLES.find(s => s.value === selectedStyle)?.icon || '🎨'}</span>
                    <span>
                      {DEFAULT_STYLES.find(s => s.value === selectedStyle)?.label || 'Style'}
                    </span>
                  </button>
                </div>



                {/* Aspect Ratio Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowAspectRatioPopover(!showAspectRatioPopover)}
                    className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Expand className="w-4 h-4" />
                    <span>
                      {selectedAspectRatio === '1:1' ? 'Square (1:1)' :
                       selectedAspectRatio === '16:9' ? 'Landscape (16:9)' :
                       selectedAspectRatio === '9:16' ? 'Portrait (9:16)' :
                       selectedAspectRatio === '4:3' ? 'Classic (4:3)' :
                       selectedAspectRatio}
                    </span>
                  </button>

                  {showAspectRatioPopover && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-popover border border-border rounded-lg shadow-lg min-w-[140px] z-50">
                      <div className="py-1">
                        {aspectRatios.map((ratio) => (
                          <button
                            key={ratio.id}
                            onClick={() => {
                              setSelectedAspectRatio(ratio.label)
                              setShowAspectRatioPopover(false)
                            }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors ${
                              selectedAspectRatio === ratio.label
                                ? 'bg-accent text-accent-foreground'
                                : 'text-foreground'
                            }`}
                          >
                            {ratio.label === '1:1' ? 'Square (1:1)' :
                             ratio.label === '16:9' ? 'Landscape (16:9)' :
                             ratio.label === '9:16' ? 'Portrait (9:16)' :
                             ratio.label === '4:3' ? 'Classic (4:3)' :
                             ratio.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Left - Model Selector */}
        <div className="absolute bottom-6 left-20">
          <div className="relative">
            <button
              onClick={() => setShowModelSelector(!showModelSelector)}
              className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors bg-card border border-border rounded-lg px-3 py-2"
            >
              <span>Model: {selectedModel}</span>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                <path d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
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

      {/* Enhanced Style Modal */}
      {showStyleModal && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowStyleModal(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setShowStyleModal(false)
            }
          }}
          tabIndex={-1}
        >
          <div
            className="bg-background rounded-lg w-full max-w-3xl max-h-[80vh] flex flex-col border border-border shadow-lg animate-in fade-in-0 zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Choose Your Style</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Select a style to transform your image generation
                </p>
              </div>
              <button
                onClick={() => setShowStyleModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded-lg"
                aria-label="Close style selector"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              <StyleSelector
                selectedStyle={selectedStyle}
                onStyleChange={(style) => {
                  setSelectedStyle(style)
                  setShowStyleModal(false)
                }}
                disabled={isGenerating}
                variant="grid"
                showTooltips={true}
                className="w-full"
              />

              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <PaintbrushIcon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-1">Style Tips</h3>
                    <p className="text-sm text-muted-foreground">
                      Different styles can dramatically change the appearance of your generated images.
                      Experiment with various styles to find the perfect aesthetic for your creative vision.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal for Expanded View */}
      {showImageModal && currentImage && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 bg-black/70 text-white p-2 rounded-full hover:bg-black/90 z-10"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Download button removed */}

            <img
              src={currentImage.url}
              alt={currentImage.prompt}
              className="max-w-full max-h-full object-contain rounded-lg"
            />

            <div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white p-4 rounded-lg">
              <p className="text-sm mb-1">{currentImage.prompt}</p>
              <p className="text-xs text-gray-300">
                {currentImage.model} • {currentImage.style} • {currentImage.aspectRatio} • {new Date(currentImage.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Collapsible Gallery Panel */}
      {showGallery && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setShowGallery(false)}>
          <div
            className="fixed left-0 top-0 bottom-0 w-80 bg-background border-r border-border shadow-xl transform transition-transform duration-300 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gallery Header - Fixed */}
            <div className="flex-shrink-0 p-4 border-b border-border bg-background">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Your Gallery</h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => loadUserImages(true)}
                    disabled={isLoadingGallery}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted disabled:opacity-50"
                    title="Refresh gallery"
                  >
                    {isLoadingGallery ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => setShowGallery(false)}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {isLoadingGallery ? 'Loading...' : `${generatedImages.length} images generated`}
              </p>
            </div>

            {/* Gallery Content - Scrollable */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
              <div className="p-4">
                {generatedImages.length === 0 ? (
                  <div className="text-center py-12">
                    <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium">No images generated yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Start creating to see your images here
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 pb-4">
                    {generatedImages.map((image, index) => (
                      <div
                        key={image.id}
                        className="relative group cursor-pointer animate-in fade-in-0 slide-in-from-bottom-2"
                        style={{ animationDelay: `${index * 50}ms` }}
                        onClick={() => {
                          setCurrentImage(image)
                          setShowGallery(false)
                        }}
                      >
                        <div className="aspect-square rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-all duration-200 hover:shadow-md">
                          {image.isLoading ? (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          ) : image.error ? (
                            <div className="w-full h-full bg-destructive/10 flex flex-col items-center justify-center">
                              <svg className="w-8 h-8 text-destructive mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className="text-xs text-destructive text-center px-2">Failed to load</p>
                            </div>
                          ) : (
                            <img
                              src={image.url}
                              alt={image.prompt}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              loading="lazy"
                              onError={(e) => {
                                console.error('Image failed to load:', image.url)
                                handleImageError(image.id)
                              }}
                              onLoad={() => handleImageLoad(image.id)}
                            />
                          )}
                        </div>

                        {/* Image Info Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg">
                          <div className="absolute bottom-2 left-2 right-2">
                            <p className="text-white text-xs font-medium truncate" title={image.prompt}>
                              {image.prompt}
                            </p>
                            <p className="text-white/80 text-xs mt-1">
                              {image.model} • {image.style} • {new Date(image.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {/* Selection Indicator */}
                        {currentImage?.id === image.id && (
                          <div className="absolute inset-0 border-2 border-primary rounded-lg bg-primary/10"></div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Gallery Footer - Fixed */}
            {generatedImages.length > 0 && (
              <div className="flex-shrink-0 p-4 border-t border-border bg-background/95 backdrop-blur-sm">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    Scroll to see more images
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Video Converter Modal */}
      {showVideoConverter && selectedImageForVideo && (
        <ImageToVideoConverter
          imageUrl={selectedImageForVideo.url}
          imagePrompt={selectedImageForVideo.prompt}
          imageMetadata={{
            style: selectedImageForVideo.style,
            aspectRatio: selectedImageForVideo.aspectRatio,
            model: selectedImageForVideo.model,
            quality: selectedImageForVideo.quality
          }}
          onClose={handleCloseVideoConverter}
          onVideoGenerated={handleVideoGenerated}
        />
      )}
    </div>
  )
}
