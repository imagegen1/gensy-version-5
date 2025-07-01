/**
 * AI Image Upscaler Page for Gensy AI Creative Suite
 * Located at /generate/upscale route
 */

import { Metadata } from 'next'
import { AIImageUpscaler } from '@/components/upscaling/AIImageUpscaler'

export const metadata: Metadata = {
  title: 'AI Image Upscaler | Gensy AI Suite',
  description: 'Enhance and upscale your images using advanced AI technology with our modern interface',
}

export default function GenerateUpscalePage() {
  return <AIImageUpscaler />
}
