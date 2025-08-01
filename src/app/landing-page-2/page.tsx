import { Metadata } from 'next'
import AiNextTemplate from './AiNextTemplate'

export const metadata: Metadata = {
  title: 'Gensy - AI Image & Video Generation Platform',
  description: 'Create production-quality visual assets for your projects with unprecedented quality, speed, and style-consistency using advanced AI models.',
  keywords: 'AI image generation, AI video generation, Gensy, artificial intelligence, creative tools',
  openGraph: {
    title: 'Gensy - AI Image & Video Generation Platform',
    description: 'Create production-quality visual assets with AI',
    type: 'website',
  }
}

export default function LandingPage2() {
  return <AiNextTemplate />
}
