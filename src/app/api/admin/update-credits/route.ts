/**
 * Admin API Endpoint for Updating User Credits
 * Secure endpoint for administrative credit updates
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

// Admin security key - should be set in environment variables
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'gensy-admin-2024-secure-key'

export async function POST(request: NextRequest) {
  try {
    // Verify admin authorization
    const authHeader = request.headers.get('authorization')
    const providedKey = authHeader?.replace('Bearer ', '')
    
    if (providedKey !== ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid admin key' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { email, credits, description = 'Admin credit update' } = body

    if (!email || credits === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: email, credits' },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient()

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, clerk_user_id, email, credits')
      .eq('email', email)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: `User not found with email: ${email}` },
        { status: 404 }
      )
    }

    console.log(`👤 Found user: ${user.email} (${user.clerk_user_id})`)
    console.log(`💳 Current credits: ${user.credits}`)
    console.log(`🎯 Setting credits to: ${credits}`)

    // Update user credits
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        credits: credits,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('❌ Error updating credits:', updateError)
      return NextResponse.json(
        { error: 'Failed to update user credits' },
        { status: 500 }
      )
    }

    // Log the transaction
    const creditDifference = credits - user.credits
    const transactionType = creditDifference > 0 ? 'bonus' : 'adjustment'
    
    const { error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: user.id,
        type: transactionType,
        amount: creditDifference,
        description: `${description} (Admin: ${user.credits} → ${credits})`
      })

    if (transactionError) {
      console.warn('⚠️ Failed to log transaction:', transactionError)
      // Don't fail the request if transaction logging fails
    }

    console.log(`✅ Successfully updated credits for ${email}`)
    console.log(`📊 Credits: ${user.credits} → ${credits} (${creditDifference > 0 ? '+' : ''}${creditDifference})`)

    return NextResponse.json({
      success: true,
      user: {
        email: user.email,
        clerk_user_id: user.clerk_user_id,
        previous_credits: user.credits,
        new_credits: credits,
        difference: creditDifference
      },
      message: `Successfully updated credits for ${email} to ${credits}`
    })

  } catch (error) {
    console.error('❌ Admin credit update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to check user credits
export async function GET(request: NextRequest) {
  try {
    // Verify admin authorization
    const authHeader = request.headers.get('authorization')
    const providedKey = authHeader?.replace('Bearer ', '')
    
    if (providedKey !== ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid admin key' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Missing email parameter' },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient()

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, clerk_user_id, email, credits, created_at, updated_at')
      .eq('email', email)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: `User not found with email: ${email}` },
        { status: 404 }
      )
    }

    // Get recent credit transactions
    const { data: transactions } = await supabase
      .from('credit_transactions')
      .select('type, amount, description, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      success: true,
      user: {
        email: user.email,
        clerk_user_id: user.clerk_user_id,
        current_credits: user.credits,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      recent_transactions: transactions || []
    })

  } catch (error) {
    console.error('❌ Admin credit check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
