/**
 * Clerk Webhook Handler for Gensy AI Creative Suite
 * Handles user lifecycle events from Clerk
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { Webhook } from 'svix'
import { syncUserProfile, deleteUserAccount } from '@/lib/auth/user-sync'
import { createServiceRoleClient } from '@/lib/supabase/server'

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

if (!webhookSecret) {
  throw new Error('Please add CLERK_WEBHOOK_SECRET to your environment variables')
}

export async function POST(request: NextRequest) {
  try {
    // Get the headers
    const headerPayload = await headers()
    const svix_id = headerPayload.get('svix-id')
    const svix_timestamp = headerPayload.get('svix-timestamp')
    const svix_signature = headerPayload.get('svix-signature')

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return NextResponse.json(
        { error: 'Missing svix headers' },
        { status: 400 }
      )
    }

    // Get the body
    const payload = await request.text()

    // Create a new Svix instance with your webhook secret
    const wh = new Webhook(webhookSecret)

    let evt: any

    // Verify the payload with the headers
    try {
      evt = wh.verify(payload, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      })
    } catch (err) {
      console.error('Error verifying webhook:', err)
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      )
    }

    // Handle the webhook
    const eventType = evt.type
    const userData = evt.data

    console.log(`Received Clerk webhook: ${eventType}`)

    switch (eventType) {
      case 'user.created':
        await handleUserCreated(userData)
        break

      case 'user.updated':
        await handleUserUpdated(userData)
        break

      case 'user.deleted':
        await handleUserDeleted(userData)
        break

      case 'session.created':
        await handleSessionCreated(userData)
        break

      default:
        console.log(`Unhandled webhook event: ${eventType}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle user creation
 */
async function handleUserCreated(userData: any) {
  try {
    console.log('Handling user created:', userData.id)

    // Sync user profile to Supabase
    const syncResult = await syncUserProfile(userData)

    if (!syncResult.success) {
      console.error('Failed to sync new user:', syncResult.error)
      return
    }

    // Log user creation event
    await logUserEvent(userData.id, 'user_created', {
      email: userData.email_addresses?.[0]?.email_address,
      created_at: userData.created_at,
    })

    console.log('Successfully created user in Supabase:', userData.id)
  } catch (error) {
    console.error('Error handling user created:', error)
  }
}

/**
 * Handle user updates
 */
async function handleUserUpdated(userData: any) {
  try {
    console.log('Handling user updated:', userData.id)

    // Sync updated user profile to Supabase
    const syncResult = await syncUserProfile(userData)

    if (!syncResult.success) {
      console.error('Failed to sync updated user:', syncResult.error)
      return
    }

    // Log user update event
    await logUserEvent(userData.id, 'user_updated', {
      email: userData.email_addresses?.[0]?.email_address,
      updated_at: userData.updated_at,
    })

    console.log('Successfully updated user in Supabase:', userData.id)
  } catch (error) {
    console.error('Error handling user updated:', error)
  }
}

/**
 * Handle user deletion
 */
async function handleUserDeleted(userData: any) {
  try {
    console.log('Handling user deleted:', userData.id)

    const supabase = createServiceRoleClient()

    // Delete user and all associated data
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('clerk_user_id', userData.id)

    if (error) {
      console.error('Failed to delete user from Supabase:', error)
      return
    }

    console.log('Successfully deleted user from Supabase:', userData.id)
  } catch (error) {
    console.error('Error handling user deleted:', error)
  }
}

/**
 * Handle session creation (user sign-in)
 */
async function handleSessionCreated(sessionData: any) {
  try {
    console.log('Handling session created for user:', sessionData.user_id)

    // Update last sign-in time
    const supabase = createServiceRoleClient()
    
    await supabase
      .from('profiles')
      .update({
        updated_at: new Date().toISOString()
      })
      .eq('clerk_user_id', sessionData.user_id)

    // Log sign-in event
    await logUserEvent(sessionData.user_id, 'user_signed_in', {
      session_id: sessionData.id,
      created_at: sessionData.created_at,
    })

    console.log('Successfully logged user sign-in:', sessionData.user_id)
  } catch (error) {
    console.error('Error handling session created:', error)
  }
}

/**
 * Log user events for analytics
 */
async function logUserEvent(clerkUserId: string, eventType: string, metadata: any) {
  try {
    const supabase = createServiceRoleClient()

    // Get user ID from Clerk ID
    const { data: user } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_user_id', clerkUserId)
      .single()

    if (!user) {
      console.warn('User not found for event logging:', clerkUserId)
      return
    }

    // Log the event
    await supabase
      .from('usage_analytics')
      .insert({
        user_id: user.id,
        event_type: eventType,
        metadata,
      })
  } catch (error) {
    console.error('Error logging user event:', error)
  }
}
