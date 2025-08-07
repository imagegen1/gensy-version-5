import { Metadata } from 'next'
import AiNextTemplate from './AiNextTemplate'

export const metadata: Metadata = {
  title: 'Gensy - AI Creative Suite',
  description: 'Create production-quality visual assets for your projects with unprecedented quality, speed, and style-consistency.',
  other: {
    'color-scheme': 'dark'
  },
}

export default function LandingPage2() {
  return <AiNextTemplate />
}
