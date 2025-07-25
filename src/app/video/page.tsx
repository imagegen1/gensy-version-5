/**
 * Video Generation Page for Gensy AI Creative Suite
 * Main page for AI video generation functionality with integrated gallery
 */

import { Metadata } from 'next'
import { Suspense } from 'react'
import { VideoPageWrapper } from '@/components/video/VideoPageWrapper'

export const metadata: Metadata = {
  title: 'AI Video Generator | Gensy',
  description: 'Create stunning videos from text descriptions using advanced AI technology',
}

export default function VideoPage() {
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
