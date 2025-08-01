/**
 * Image Generation Page for Gensy AI Creative Suite
 * Main page for AI image generation functionality
 * PROTECTED ROUTE - Requires authentication
 */

import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { ImageGeneratorInterface } from '@/components/ai-image-generator/ImageGeneratorInterface'

export const metadata: Metadata = {
  title: 'Generate Image | Gensy',
  description: 'Create stunning images from text descriptions using advanced AI technology',
}

export default async function GenerateImagePage() {
  // Check authentication - this is a protected route
  const { userId } = await auth()

  if (!userId) {
    // Redirect to sign-in with return URL
    redirect('/auth/sign-in?returnUrl=/generate/image')
  }

  return (
    <div className="min-h-screen">
      <ImageGeneratorInterface />
    </div>
  )
}
