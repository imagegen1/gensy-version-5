/**
 * User Data Export API Route for Gensy AI Creative Suite
 * Handles exporting user data in JSON format
 */

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getCurrentUser } from '@/lib/auth'
import { CreditService } from '@/lib/credits'
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

    // Get user data
    const userResult = await getCurrentUser()
    if (!userResult.success || !userResult.user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const supabase = createServiceRoleClient()
    const user = userResult.user

    // Get all user data
    const [
      creditBalance,
      transactions,
      preferences,
      generations,
      mediaFiles
    ] = await Promise.all([
      CreditService.getCreditBalance(userId),
      CreditService.getTransactionHistory(1000, 0, userId),
      fetch('/api/user/preferences').then(res => res.ok ? res.json() : {}),
      supabase
        .from('generations')
        .select('*')
        .eq('user_id', user.id),
      supabase
        .from('media_files')
        .select('*')
        .eq('user_id', user.id)
    ])

    // Compile export data
    const exportData = {
      export_info: {
        exported_at: new Date().toISOString(),
        user_id: userId,
        export_version: '1.0'
      },
      profile: {
        id: user.id,
        clerk_user_id: user.clerk_user_id,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        credits: user.credits,
        subscription_status: user.subscription_status,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      credits: {
        balance: creditBalance,
        transactions: transactions
      },
      preferences: preferences.preferences || {},
      generations: generations.data || [],
      media_files: (mediaFiles.data || []).map(file => ({
        ...file,
        // Remove sensitive file paths for security
        file_path: '[REDACTED]'
      })),
      statistics: {
        total_generations: generations.data?.length || 0,
        total_media_files: mediaFiles.data?.length || 0,
        total_credits_used: creditBalance.total_spent,
        account_age_days: Math.floor(
          (new Date().getTime() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
        )
      }
    }

    // Create response with proper headers for file download
    const response = new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="gensy-data-export-${new Date().toISOString().split('T')[0]}.json"`,
        'Cache-Control': 'no-cache'
      }
    })

    return response
  } catch (error) {
    console.error('Export data API error:', error)
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    )
  }
}
