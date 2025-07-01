/**
 * Interactive Unified Gallery Page for Gensy AI Creative Suite
 * Pure masonry-style interactive gallery for images and videos
 */

import { Metadata } from 'next'
import { InteractiveUnifiedGalleryWrapper } from '@/components/gallery/InteractiveUnifiedGalleryWrapper'

export const metadata: Metadata = {
  title: 'Gallery | Gensy',
  description: 'Interactive masonry gallery for your AI-generated images and videos',
}

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-white">
      <InteractiveUnifiedGalleryWrapper />
    </div>
  )
}
