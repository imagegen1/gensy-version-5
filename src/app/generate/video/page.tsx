/**
 * Video Generation Page for Gensy AI Creative Suite
 * Implements the videoui/ux.json specifications for video generation
 */

import { Metadata } from 'next'
import { VideoGenerator } from '@/components/video/VideoGenerator'

export const metadata: Metadata = {
  title: 'Video Generator | Gensy',
  description: 'Create stunning AI-generated videos from text descriptions and images',
}

export default function VideoGenerationPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <VideoGenerator />
    </div>
  )
}
