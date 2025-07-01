/**
 * Image Upscaling Page for Gensy AI Creative Suite
 * Main page for AI image upscaling functionality
 */

import { Metadata } from 'next'
import { ImageUpscaler } from '@/components/upscaling/ImageUpscaler'

export const metadata: Metadata = {
  title: 'AI Image Upscaler | Gensy',
  description: 'Enhance and upscale your images using advanced AI technology',
}

export default function UpscalePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ImageUpscaler />
    </div>
  )
}
