/**
 * AI Models API Endpoint for Gensy AI Creative Suite
 * Handles fetching available AI models for video generation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { VertexAIService } from '@/lib/services/vertex-ai'

export async function GET(request: NextRequest) {
  console.log('🤖 AI Models API: Request received')
  try {
    const supabase = createServiceRoleClient()

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'video'
    console.log('🤖 AI Models API: Requested type:', type)

    // If requesting video models, combine Vertex AI and database models
    if (type === 'video') {
      let vertexVideoModels = []

      try {
        const vertexModels = await VertexAIService.getAvailableModels('video')
        if (vertexModels.success) {
          // Transform Vertex AI video models to match expected format
          vertexVideoModels = vertexModels.models.map(model => ({
            id: model.id,
            name: model.id,
            display_name: model.name,
            type: 'video',
            provider: model.provider || 'google-vertex-ai',
            status: 'active',
            description: `Advanced video generation model with ${model.capabilities.join(', ')} capabilities`,
            pricing_credits: model.pricing_credits || 10,
            max_duration: model.maxDuration || 60,
            supported_aspect_ratios: model.supportedAspectRatios || ['16:9', '9:16'],
            supported_resolutions: model.supportedResolutions || ['480p', '720p'],
            is_featured: model.id === 'veo-002',
            capabilities: {
              textToVideo: model.capabilities.includes('text-to-video'),
              imageToVideo: model.capabilities.includes('image-to-video'),
              frameToVideo: model.capabilities.includes('frame-to-video'),
              highQuality: model.capabilities.includes('high-quality-generation') || model.capabilities.includes('ultra-high-quality'),
              maxDuration: model.maxDuration
            }
          }))
          console.log('🤖 AI Models API: Fetched Vertex AI video models:', vertexVideoModels.length)
        }
      } catch (error) {
        console.error('Error fetching Vertex AI video models:', error)
      }

      // Always fetch database models for video type to include ByteDance and other models
      try {
        const { data: dbModels, error: dbError } = await supabase
          .from('ai_models')
          .select('*')
          .eq('type', 'video')
          .order('sort_order', { ascending: true })

        if (!dbError && dbModels) {
          // Transform database models to match expected format
          const transformedDbModels = dbModels.map(model => ({
            id: model.id,
            name: model.name,
            display_name: model.display_name,
            type: model.type,
            provider: model.provider,
            status: model.status,
            description: model.description,
            pricing_credits: model.pricing_credits,
            max_duration: model.max_duration,
            supported_aspect_ratios: model.supported_aspect_ratios,
            is_featured: model.is_featured,
            capabilities: model.capabilities
          }))

          console.log('🤖 AI Models API: Fetched database video models:', transformedDbModels.length)

          // Combine Vertex AI and database models, prioritizing database models
          const allVideoModels = [...transformedDbModels, ...vertexVideoModels]
          console.log('🤖 AI Models API: Returning combined video models:', allVideoModels.length)
          return NextResponse.json(allVideoModels)
        }
      } catch (error) {
        console.error('Error fetching database video models:', error)
      }

      // If database query failed but we have Vertex AI models, return those
      if (vertexVideoModels.length > 0) {
        console.log('🤖 AI Models API: Returning Vertex AI video models only:', vertexVideoModels.length)
        return NextResponse.json(vertexVideoModels)
      }
    }

    // If requesting image models, return Vertex AI Imagen models
    if (type === 'image') {
      try {
        const vertexModels = await VertexAIService.getAvailableModels('image')
        if (vertexModels.success) {
          // Transform Vertex AI models to match expected format
          const imagenModels = [
            {
              id: 'imagen-3.0-generate-001',
              name: 'imagen-3.0-generate-001',
              display_name: 'Imagen 3.0',
              type: 'image',
              provider: 'google-vertex-ai',
              status: 'active',
              description: 'Latest Imagen model with highest quality image generation',
              pricing_credits: 10,
              max_duration: null,
              supported_aspect_ratios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
              is_featured: true,
              capabilities: {
                textToImage: true,
                styleTransfer: true,
                highQuality: true,
                maxResolution: '1536x1536'
              }
            },
            {
              id: 'imagen-3.0-fast-generate-001',
              name: 'imagen-3.0-fast-generate-001',
              display_name: 'Imagen 3.0 Fast',
              type: 'image',
              provider: 'google-vertex-ai',
              status: 'active',
              description: 'Faster version of Imagen 3.0 with good quality',
              pricing_credits: 5,
              max_duration: null,
              supported_aspect_ratios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
              is_featured: false,
              capabilities: {
                textToImage: true,
                styleTransfer: true,
                fastGeneration: true,
                maxResolution: '1024x1024'
              }
            },
            {
              id: 'imagegeneration@006',
              name: 'imagegeneration@006',
              display_name: 'Imagen 2.0',
              type: 'image',
              provider: 'google-vertex-ai',
              status: 'active',
              description: 'Previous generation Imagen model',
              pricing_credits: 3,
              max_duration: null,
              supported_aspect_ratios: ['1:1', '16:9', '9:16', '4:3'],
              is_featured: false,
              capabilities: {
                textToImage: true,
                maxResolution: '1024x1024'
              }
            },
            {
              id: 'seedream-3-0-t2i-250415',
              name: 'seedream-3-0-t2i-250415',
              display_name: 'Bytedance Seedream 3.0',
              type: 'image',
              provider: 'byteplus-modelark',
              status: 'active',
              description: 'Advanced text-to-image model by Bytedance with excellent semantic understanding',
              pricing_credits: 3,
              max_duration: null,
              supported_aspect_ratios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
              is_featured: true,
              capabilities: {
                textToImage: true,
                highQuality: true,
                fastGeneration: true,
                maxResolution: '1920x1080'
              }
            },
            // Black Forest Labs (BFL) Flux models
            {
              id: 'flux-kontext-pro',
              name: 'flux-kontext-pro',
              display_name: 'Flux Kontext Pro',
              type: 'image',
              provider: 'black-forest-labs',
              status: 'active',
              description: 'Professional image generation and editing model with advanced context understanding',
              pricing_credits: 8,
              max_duration: null,
              supported_aspect_ratios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
              is_featured: true,
              capabilities: {
                textToImage: true,
                imageEditing: true,
                highQuality: true,
                maxResolution: '1920x1080'
              }
            },
            {
              id: 'flux-kontext-max',
              name: 'flux-kontext-max',
              display_name: 'Flux Kontext Max',
              type: 'image',
              provider: 'black-forest-labs',
              status: 'active',
              description: 'Maximum quality image generation with advanced editing capabilities',
              pricing_credits: 12,
              max_duration: null,
              supported_aspect_ratios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
              is_featured: true,
              capabilities: {
                textToImage: true,
                imageEditing: true,
                ultraHighQuality: true,
                maxResolution: '1920x1080'
              }
            },
            {
              id: 'flux-pro-1.1-ultra',
              name: 'flux-pro-1.1-ultra',
              display_name: 'Flux Pro 1.1 Ultra',
              type: 'image',
              provider: 'black-forest-labs',
              status: 'active',
              description: 'Ultra-high quality image generation with exceptional detail and realism',
              pricing_credits: 10,
              max_duration: null,
              supported_aspect_ratios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
              is_featured: true,
              capabilities: {
                textToImage: true,
                ultraHighQuality: true,
                maxResolution: '1920x1080'
              }
            },
            {
              id: 'flux-pro-1.1',
              name: 'flux-pro-1.1',
              display_name: 'Flux Pro 1.1',
              type: 'image',
              provider: 'black-forest-labs',
              status: 'active',
              description: 'Professional-grade image generation with excellent prompt following',
              pricing_credits: 6,
              max_duration: null,
              supported_aspect_ratios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
              is_featured: false,
              capabilities: {
                textToImage: true,
                highQuality: true,
                maxResolution: '1920x1080'
              }
            },
            {
              id: 'flux-pro',
              name: 'flux-pro',
              display_name: 'Flux Pro',
              type: 'image',
              provider: 'black-forest-labs',
              status: 'active',
              description: 'Professional image generation model with high quality output',
              pricing_credits: 4,
              max_duration: null,
              supported_aspect_ratios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
              is_featured: false,
              capabilities: {
                textToImage: true,
                highQuality: true,
                maxResolution: '1920x1080'
              }
            },
            {
              id: 'flux-dev',
              name: 'flux-dev',
              display_name: 'Flux Dev',
              type: 'image',
              provider: 'black-forest-labs',
              status: 'active',
              description: 'Development version of Flux model for experimentation and testing',
              pricing_credits: 2,
              max_duration: null,
              supported_aspect_ratios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
              is_featured: false,
              capabilities: {
                textToImage: true,
                fastGeneration: true,
                maxResolution: '1920x1080'
              }
            }
          ]

          return NextResponse.json(imagenModels)
        }
      } catch (error) {
        console.error('Error fetching Vertex AI models:', error)
        // Fall through to database query as fallback
      }
    }

    // Fetch AI models from database (for video and other types)
    const { data: models, error } = await supabase
      .from('ai_models')
      .select('*')
      .eq('type', type)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching AI models:', error)
      return NextResponse.json(
        { error: 'Failed to fetch AI models' },
        { status: 500 }
      )
    }

    // Transform the data to match the expected format
    const transformedModels = models.map(model => ({
      id: model.id,
      name: model.name,
      display_name: model.display_name,
      type: model.type,
      provider: model.provider,
      status: model.status,
      description: model.description,
      pricing_credits: model.pricing_credits,
      max_duration: model.max_duration,
      supported_aspect_ratios: model.supported_aspect_ratios,
      is_featured: model.is_featured,
      capabilities: model.capabilities
    }))

    return NextResponse.json(transformedModels)

  } catch (error) {
    console.error('Error in AI models API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createServiceRoleClient()
    
    // Validate required fields
    const {
      name,
      display_name,
      type,
      provider,
      status = 'active',
      description,
      pricing_credits = 5,
      max_duration,
      supported_aspect_ratios = ['16:9', '9:16', '1:1'],
      is_featured = false,
      sort_order = 0,
      capabilities = {}
    } = body
    
    if (!name || !display_name || !type || !provider) {
      return NextResponse.json(
        { error: 'Missing required fields: name, display_name, type, provider' },
        { status: 400 }
      )
    }
    
    // Insert new AI model
    const { data: model, error } = await supabase
      .from('ai_models')
      .insert({
        name,
        display_name,
        type,
        provider,
        status,
        description,
        pricing_credits,
        max_duration,
        supported_aspect_ratios,
        is_featured,
        sort_order,
        capabilities
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating AI model:', error)
      return NextResponse.json(
        { error: 'Failed to create AI model' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(model, { status: 201 })
    
  } catch (error) {
    console.error('Error in AI models POST API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
