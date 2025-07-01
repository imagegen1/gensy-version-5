/**
 * Image Generation Page for Gensy AI Creative Suite
 * Main page for AI image generation functionality
 */

import { Metadata } from 'next'
import { ImageGeneratorInterface } from '@/components/ai-image-generator/ImageGeneratorInterface'

export const metadata: Metadata = {
  title: 'Generate Image | Gensy',
  description: 'Create stunning images from text descriptions using advanced AI technology',
}

export default function GenerateImagePage() {
  return (
    <div className="min-h-screen">
      <ImageGeneratorInterface />
    </div>
  )
}
