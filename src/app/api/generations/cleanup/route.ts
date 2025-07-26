import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { auth } from '@clerk/nextjs/server'

/**
 * 🧹 AUTOMATIC CLEANUP API
 * 
 * This endpoint automatically removes failed generations from the database
 * to maintain a clean user experience and reduce database clutter.
 * 
 * Features:
 * - Removes failed generations older than specified time
 * - Logs cleanup actions for debugging
 * - Only affects the requesting user's generations
 * - Returns cleanup statistics
 */

export async function DELETE(request: NextRequest) {
  try {
    console.log('🧹 CLEANUP API: Starting failed generations cleanup...')

    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      console.log('🧹 CLEANUP API: User not authenticated')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get current user
    const userResult = await getCurrentUser()
    if (!userResult.success || !userResult.user) {
      console.log('🧹 CLEANUP API: User not found')
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const profileId = userResult.user.id
    console.log(`🧹 CLEANUP API: Cleaning up failed generations for user: ${userId}`)

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const olderThanHours = parseInt(searchParams.get('olderThanHours') || '1') // Default: 1 hour
    const dryRun = searchParams.get('dryRun') === 'true' // Default: false

    // Calculate cutoff time
    const cutoffTime = new Date()
    cutoffTime.setHours(cutoffTime.getHours() - olderThanHours)

    console.log(`🧹 CLEANUP API: Removing failed generations older than: ${cutoffTime.toISOString()}`)
    console.log(`🧹 CLEANUP API: Dry run mode: ${dryRun}`)

    const supabase = createServiceRoleClient()

    // First, get the failed generations to be cleaned up (for logging)
    const { data: failedGenerations, error: selectError } = await supabase
      .from('generations')
      .select('id, type, prompt, created_at, error_message')
      .eq('user_id', profileId)
      .eq('status', 'failed')
      .lt('updated_at', cutoffTime.toISOString())

    if (selectError) {
      console.error('🧹 CLEANUP API: Error querying failed generations:', selectError)
      return NextResponse.json(
        { error: 'Failed to query generations' },
        { status: 500 }
      )
    }

    const failedCount = failedGenerations?.length || 0
    console.log(`🧹 CLEANUP API: Found ${failedCount} failed generations to clean up`)

    // Log details of what will be cleaned up
    if (failedGenerations && failedGenerations.length > 0) {
      console.log('🧹 CLEANUP API: Failed generations to be cleaned up:')
      failedGenerations.forEach((gen, index) => {
        console.log(`  ${index + 1}. ID: ${gen.id}, Type: ${gen.type}, Created: ${gen.created_at}, Error: ${gen.error_message?.substring(0, 50)}...`)
      })
    }

    let deletedCount = 0

    // Perform cleanup if not in dry run mode
    if (!dryRun && failedCount > 0) {
      const { error: deleteError } = await supabase
        .from('generations')
        .delete()
        .eq('user_id', profileId)
        .eq('status', 'failed')
        .lt('updated_at', cutoffTime.toISOString())

      if (deleteError) {
        console.error('🧹 CLEANUP API: Error deleting failed generations:', deleteError)
        return NextResponse.json(
          { error: 'Failed to delete generations' },
          { status: 500 }
        )
      }

      deletedCount = failedCount
      console.log(`🧹 CLEANUP API: Successfully deleted ${deletedCount} failed generations`)
    } else if (dryRun) {
      console.log(`🧹 CLEANUP API: Dry run - would delete ${failedCount} failed generations`)
    } else {
      console.log('🧹 CLEANUP API: No failed generations found to clean up')
    }

    // Return cleanup statistics
    return NextResponse.json({
      success: true,
      message: dryRun 
        ? `Dry run completed - would clean up ${failedCount} failed generations`
        : `Successfully cleaned up ${deletedCount} failed generations`,
      statistics: {
        failedGenerationsFound: failedCount,
        generationsDeleted: dryRun ? 0 : deletedCount,
        cutoffTime: cutoffTime.toISOString(),
        olderThanHours,
        dryRun
      },
      cleanedGenerations: dryRun ? failedGenerations : undefined // Only return details in dry run
    })

  } catch (error) {
    console.error('🧹 CLEANUP API: Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * 🧹 GET endpoint for cleanup statistics (without actually cleaning up)
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🧹 CLEANUP API: Getting cleanup statistics...')

    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get current user
    const userResult = await getCurrentUser()
    if (!userResult.success || !userResult.user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const profileId = userResult.user.id
    const { searchParams } = new URL(request.url)
    const olderThanHours = parseInt(searchParams.get('olderThanHours') || '1')

    // Calculate cutoff time
    const cutoffTime = new Date()
    cutoffTime.setHours(cutoffTime.getHours() - olderThanHours)

    const supabase = createServiceRoleClient()

    // Get failed generations count
    const { data: failedGenerations, error } = await supabase
      .from('generations')
      .select('id, type, created_at')
      .eq('user_id', profileId)
      .eq('status', 'failed')
      .lt('updated_at', cutoffTime.toISOString())

    if (error) {
      console.error('🧹 CLEANUP API: Error querying failed generations:', error)
      return NextResponse.json(
        { error: 'Failed to query generations' },
        { status: 500 }
      )
    }

    const failedCount = failedGenerations?.length || 0

    return NextResponse.json({
      success: true,
      statistics: {
        failedGenerationsFound: failedCount,
        cutoffTime: cutoffTime.toISOString(),
        olderThanHours
      }
    })

  } catch (error) {
    console.error('🧹 CLEANUP API: Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
