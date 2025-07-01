import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { ToastProvider } from '@/components/ui'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Gensy - AI Creative Suite',
    template: '%s | Gensy',
  },
  description: 'Gensy AI Creative Suite - Transform your ideas into stunning visuals with AI-powered image generation, upscaling, and video creation.',
  keywords: [
    'AI image generation',
    'AI video creation',
    'image upscaling',
    'creative suite',
    'artificial intelligence',
    'digital art',
    'content creation',
  ],
  authors: [{ name: 'Gensy Team' }],
  creator: 'Gensy',
  publisher: 'Gensy',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Gensy - AI Creative Suite',
    description: 'Transform your ideas into stunning visuals with AI-powered image generation, upscaling, and video creation.',
    siteName: 'Gensy',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Gensy AI Creative Suite',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gensy - AI Creative Suite',
    description: 'Transform your ideas into stunning visuals with AI-powered image generation, upscaling, and video creation.',
    images: ['/og-image.png'],
    creator: '@gensy_ai',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
    >
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="icon" href="/favicon.ico" />
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
          <link rel="manifest" href="/site.webmanifest" />
        </head>
        <body className={inter.className}>
          <ToastProvider>
            <div id="root">
              {children}
            </div>
            <div id="modal-root" />
            <div id="toast-root" />
            <div id="clerk-captcha" />
          </ToastProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
