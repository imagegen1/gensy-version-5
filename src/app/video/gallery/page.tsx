/**
 * Interactive Video Gallery Page for Gensy AI Creative Suite
 * Pure masonry-style interactive gallery for videos
 */

import { Metadata } from 'next'
import { InteractiveVideoGalleryWrapper } from '@/components/video/InteractiveVideoGalleryWrapper'

export const metadata: Metadata = {
  title: 'Video Gallery | Gensy',
  description: 'Interactive masonry gallery for your AI-generated videos',
}

export default function VideoGalleryPage() {
  return (
    <div className="min-h-screen bg-white">
      <InteractiveVideoGalleryWrapper />
    </div>
  )
}
