/**
 * Video Generation Page for Gensy AI Creative Suite
 * Main page for AI video generation functionality with integrated gallery
 * PROTECTED ROUTE - Requires authentication
 */

import { Metadata } from 'next'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { VideoPageWrapper } from '@/components/video/VideoPageWrapper'

export const metadata: Metadata = {
  title: 'AI Video Generator | Gensy',
  description: 'Create stunning videos from text descriptions using advanced AI technology',
}

export default async function VideoPage() {
  // Check authentication - this is a protected route
  const { userId } = await auth()

  if (!userId) {
    // Redirect to sign-in with return URL
    redirect('/auth/sign-in?returnUrl=/video')
  }

  return (
    <div className="min-h-screen bg-white">
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading video generator...</p>
        </div>
      </div>}>
        <VideoPageWrapper />
      </Suspense>
    </div>
  )
}
