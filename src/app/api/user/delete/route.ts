/**
 * User Account Deletion API Route for Gensy AI Creative Suite
 * Handles permanent account deletion and data cleanup
 */

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { deleteUserAccount } from '@/lib/auth'

export async function DELETE() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Delete user account and all associated data
    const result = await deleteUserAccount()
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to delete account' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully'
    })
  } catch (error) {
    console.error('Delete account API error:', error)
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    )
  }
}
