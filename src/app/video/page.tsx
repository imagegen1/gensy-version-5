/**
 * Video Generation Page for Gensy AI Creative Suite
 * Main page for AI video generation functionality with integrated gallery
 */

import { Metadata } from 'next'
import { EnhancedVideoGenerationInterface } from '@/components/video/EnhancedVideoGenerationInterface'

export const metadata: Metadata = {
  title: 'AI Video Generator | Gensy',
  description: 'Create stunning videos from text descriptions using advanced AI technology',
}

export default function VideoPage() {
  return (
    <div className="min-h-screen bg-white">
      <EnhancedVideoGenerationInterface />
    </div>
  )
}
