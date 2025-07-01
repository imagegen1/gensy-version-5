import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const requestId = `user_images_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  console.log(`📸 [${requestId}] USER IMAGES API: Request received`)
  
  try {
    // Check authentication
    console.log(`🔐 [${requestId}] USER IMAGES API: Checking authentication...`)
    const { userId } = await auth()
    if (!userId) {
      console.log(`❌ [${requestId}] USER IMAGES API: Authentication failed - no userId`)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.log(`✅ [${requestId}] USER IMAGES API: Authentication successful - userId: ${userId}`)

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit
    const type = searchParams.get('type') // Filter by generation type: 'image', 'upscale', or null for all

    console.log(`📋 [${requestId}] USER IMAGES API: Query parameters:`, { page, limit, offset, type })

    const supabase = createServiceRoleClient()

    // Get user profile
    console.log(`👤 [${requestId}] USER IMAGES API: Fetching user profile...`)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()

    if (!profile) {
      console.log(`❌ [${requestId}] USER IMAGES API: User profile not found`)
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }
    console.log(`✅ [${requestId}] USER IMAGES API: User profile found - profileId: ${profile.id}`)

    // Fetch user's generated images with generation details
    console.log(`🖼️ [${requestId}] USER IMAGES API: Fetching user images...`)

    // Build the query with conditional type filtering
    let query = supabase
      .from('media_files')
      .select(`
        id,
        filename,
        file_path,
        file_size,
        width,
        height,
        created_at,
        metadata,
        generations!inner(
          id,
          type,
          prompt,
          model,
          status,
          parameters,
          metadata,
          created_at,
          processing_time_ms
        )
      `)
      .eq('user_id', profile.id)
      .eq('generations.status', 'completed')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply type filtering if specified
    if (type) {
      console.log(`🔍 [${requestId}] USER IMAGES API: Filtering by type: ${type}`)
      query = query.eq('generations.type', type)
    } else {
      // Default: show both image and upscale types
      query = query.in('generations.type', ['image', 'upscale'])
    }

    const { data: images, error: imagesError } = await query

    if (imagesError) {
      console.error(`❌ [${requestId}] USER IMAGES API: Failed to fetch images:`, imagesError)
      return NextResponse.json(
        { error: 'Failed to fetch images' },
        { status: 500 }
      )
    }

    console.log(`✅ [${requestId}] USER IMAGES API: Found ${images?.length || 0} images`)

    // Get total count for pagination - use a simple count based on the actual results
    const totalImages = images?.length || 0


    const totalPages = Math.ceil(totalImages / limit)

    console.log(`📊 [${requestId}] USER IMAGES API: Pagination info:`, {
      totalImages,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    })

    // Transform the data for frontend consumption
    const transformedImages = images?.map(image => {
      const generation = image.generations
      const isUpscaled = generation?.type === 'upscale'

      return {
        id: image.id,
        url: image.file_path,
        filename: image.filename,
        prompt: generation?.prompt || '',
        model: generation?.model || '',
        type: generation?.type || 'image',
        aspectRatio: isUpscaled
          ? calculateAspectRatio(image.width, image.height)
          : (generation?.parameters?.aspectRatio || '1:1'),
        style: generation?.parameters?.style || 'realistic',
        quality: generation?.parameters?.quality || 'standard',
        createdAt: image.created_at,
        generationTime: generation?.processing_time_ms,
        width: image.width,
        height: image.height,
        fileSize: image.file_size,
        metadata: image.metadata,
        // Additional upscale-specific metadata
        ...(isUpscaled && {
          scaleFactor: generation?.metadata?.scaleFactor,
          enhancement: generation?.metadata?.enhancement,
          originalDimensions: generation?.metadata?.originalDimensions
        })
      }
    }) || []

    // Helper function to calculate aspect ratio from dimensions
    function calculateAspectRatio(width: number | null, height: number | null): string {
      if (!width || !height) return '1:1'
      const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b)
      const divisor = gcd(width, height)
      return `${width / divisor}:${height / divisor}`
    }

    // Count different types of images
    const imageCount = transformedImages.filter(img => img.type === 'image').length
    const upscaleCount = transformedImages.filter(img => img.type === 'upscale').length

    const response = {
      success: true,
      images: transformedImages,
      pagination: {
        currentPage: page,
        totalPages,
        totalImages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit
      },
      counts: {
        total: transformedImages.length,
        images: imageCount,
        upscaled: upscaleCount
      }
    }

    console.log(`🎉 [${requestId}] USER IMAGES API: Request completed successfully`)
    console.log(`📤 [${requestId}] USER IMAGES API: Returning ${transformedImages.length} images (${imageCount} generated, ${upscaleCount} upscaled)`)
    console.log(`📸 [${requestId}] USER IMAGES API: Sample image data:`, transformedImages.slice(0, 2))

    return NextResponse.json(response)

  } catch (error) {
    console.error(`💥 [${requestId}] USER IMAGES API: Unexpected error:`, error)
    console.error(`💥 [${requestId}] USER IMAGES API: Error details:`, {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    })
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
