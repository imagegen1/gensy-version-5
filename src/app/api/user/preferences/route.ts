/**
 * User Preferences API for Gensy AI Creative Suite
 * Handles saving and retrieving user preferences
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createServiceRoleClient()

    // Get user preferences
    const { data: user, error } = await supabase
      .from('profiles')
      .select('preferences, onboarding_completed')
      .eq('clerk_user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching user preferences:', error)
      return NextResponse.json(
        { error: 'Failed to fetch preferences' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      preferences: user?.preferences || {},
      onboarding_completed: user?.onboarding_completed || false,
    })
  } catch (error) {
    console.error('Error in GET /api/user/preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { interests, onboarding_completed, ...otherPreferences } = body

    const supabase = createServiceRoleClient()

    // Prepare preferences object
    const preferences = {
      interests: interests || [],
      ...otherPreferences,
    }

    // Update user preferences
    const { data: user, error } = await supabase
      .from('profiles')
      .update({
        preferences,
        onboarding_completed: onboarding_completed || false,
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user preferences:', error)
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      preferences: user.preferences,
      onboarding_completed: user.onboarding_completed,
    })
  } catch (error) {
    console.error('Error in POST /api/user/preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const supabase = createServiceRoleClient()

    // Get current preferences
    const { data: currentUser, error: fetchError } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('clerk_user_id', userId)
      .single()

    if (fetchError) {
      console.error('Error fetching current preferences:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch current preferences' },
        { status: 500 }
      )
    }

    // Merge with existing preferences
    const updatedPreferences = {
      ...currentUser.preferences,
      ...body,
    }

    // Update user preferences
    const { data: user, error } = await supabase
      .from('profiles')
      .update({
        preferences: updatedPreferences,
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user preferences:', error)
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      preferences: user.preferences,
    })
  } catch (error) {
    console.error('Error in PATCH /api/user/preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
