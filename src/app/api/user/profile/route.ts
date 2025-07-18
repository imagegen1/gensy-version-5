/**
 * User Profile API Route for Gensy AI Creative Suite
 * Handles user profile operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getCurrentUser, updateUserProfile } from '@/lib/auth'
import { Sanitizer } from '@/lib/security'

// Safely sanitize preferences object to prevent prototype pollution
function sanitizePreferences(preferences: any): any {
  if (!preferences || typeof preferences !== 'object') {
    return {}
  }

  const sanitized: any = {}

  for (const [key, value] of Object.entries(preferences)) {
    // Block prototype pollution attempts
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue
    }

    // Recursively sanitize nested objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizePreferences(value)
    } else if (typeof value === 'string') {
      sanitized[key] = Sanitizer.sanitizeString(value)
    } else if (typeof value === 'boolean' || typeof value === 'number') {
      sanitized[key] = value
    }
    // Skip other types (functions, symbols, etc.)
  }

  return sanitized
}

export async function GET() {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get current user
    const userResult = await getCurrentUser()
    if (!userResult.success) {
      return NextResponse.json(
        { error: userResult.error || 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: userResult.user,
    })
  } catch (error) {
    console.error('Get profile API error:', error)
    return NextResponse.json(
      { error: 'Failed to get profile' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { full_name, avatar_url, preferences } = body

    // Validate and sanitize input to prevent prototype pollution
    const updates: any = {}
    if (full_name !== undefined) {
      updates.full_name = Sanitizer.sanitizeString(full_name)
    }
    if (avatar_url !== undefined && avatar_url !== '') {
      updates.avatar_url = Sanitizer.validateUrl(avatar_url, 'trusted')
    }
    if (preferences !== undefined) {
      // Sanitize preferences object to prevent prototype pollution
      updates.preferences = sanitizePreferences(preferences)
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    // Update user profile
    const result = await updateUserProfile(updates)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Update failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      user: result.user,
    })
  } catch (error) {
    console.error('Update profile API error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
