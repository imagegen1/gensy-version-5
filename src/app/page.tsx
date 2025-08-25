import { Metadata } from 'next'
import AiNextTemplate from './landing-page-2/AiNextTemplate'

export const metadata: Metadata = {
  title: 'Gensy - AI Creative Suite',
  description: 'Create production-quality visual assets for your projects with unprecedented quality, speed, and style-consistency.',
  other: {
    'color-scheme': 'dark'
  },
}

export default function HomePage() {
  return <AiNextTemplate />
}