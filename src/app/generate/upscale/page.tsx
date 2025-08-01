/**
 * AI Image Upscaler Page for Gensy AI Creative Suite
 * Located at /generate/upscale route
 * PROTECTED ROUTE - Requires authentication
 */

import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { AIImageUpscaler } from '@/components/upscaling/AIImageUpscaler'

export const metadata: Metadata = {
  title: 'AI Image Upscaler | Gensy AI Suite',
  description: 'Enhance and upscale your images using advanced AI technology with our modern interface',
}

export default async function GenerateUpscalePage() {
  // Check authentication - this is a protected route
  const { userId } = await auth()

  if (!userId) {
    // Redirect to sign-in with return URL
    redirect('/auth/sign-in?returnUrl=/generate/upscale')
  }

  return <AIImageUpscaler />
}
