import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import { ClerkProvider } from '@clerk/nextjs'
import { ToastProvider } from '@/components/ui'
import { NotificationProvider } from '@/components/ui/notification-system'
import { getBaseUrl } from '@/lib/utils'
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
  metadataBase: new URL(getBaseUrl()),
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
  // Check if Clerk is disabled in development
  const isClerkDisabled = process.env.NEXT_PUBLIC_CLERK_DISABLED === 'true'
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' ||
                     process.env.CI === 'true' ||
                     process.env.VERCEL === '1'

  // Use a properly formatted test key for build time
  const buildTimeKey = 'pk_test_Y2xlcmsuaW5jbHVkZWQua2F0eWRpZC05Mi5sY2wuZGV2JA'
  const effectiveKey = clerkPublishableKey || buildTimeKey

  // Content wrapper
  const content = (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* ABSOLUTE PRIORITY: Hero video preload - FIRST before everything else */}
        <link rel="preload"
              as="video"
              href="/videos/hailuo-ai-video-02.webm"
              type="video/webm"
              crossOrigin="anonymous" />
        <link rel="preload"
              as="video"
              href="/videos/hailuo-ai-video-02.mp4"
              type="video/mp4"
              crossOrigin="anonymous" />
        <link rel="preload"
              as="image"
              href="/images/hero-poster.jpg"
              crossOrigin="anonymous" />

        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />

        {/* Critical CSS - Load immediately */}
        <link rel="stylesheet" href="/ainext-template/assets/css/bootstrap.min.css" />
        <link rel="stylesheet" href="/ainext-template/assets/css/style.css" />
        <link rel="stylesheet" href="/ainext-template/assets/css/responsive.css" />

        {/* Non-critical CSS - Load normally to avoid errors */}
        <link rel="stylesheet" href="/ainext-template/assets/css/owl.carousel.min.css" />
        <link rel="stylesheet" href="/ainext-template/assets/css/owl.theme.default.min.css" />
        <link rel="stylesheet" href="/ainext-template/assets/css/remixicon.min.css" />
        <link rel="stylesheet" href="/ainext-template/assets/css/odometer.min.css" />
        <link rel="stylesheet" href="/ainext-template/assets/css/flaticon.css" />
        <link rel="stylesheet" href="/ainext-template/assets/css/aos.css" />

        {/* Preload critical resources */}
        <link rel="preload" href="/ainext-template/assets/img/main logo.svg" as="image" />
        <link rel="preload" href="/ainext-template/assets/js/jquery.min.js" as="script" />
        <link rel="preload" href="/ainext-template/assets/js/bootstrap.bundle.min.js" as="script" />

        {/* Preload showcase video files for lazy loading */}
        <link rel="preload" href="/videos/seedream.webm" as="video" />
        <link rel="preload" href="/videos/seedream.mp4" as="video" />
        <link rel="preload" href="/videos/veo 3.webm" as="video" />
        <link rel="preload" href="/videos/veo 3.mp4" as="video" />
        <link rel="preload" href="/videos/minimax.webm" as="video" />
        <link rel="preload" href="/videos/minimax.mp4" as="video" />
      </head>
      <body className={inter.className}>
        <NotificationProvider>
          <ToastProvider>
            <div id="root">
              {children}
            </div>
            <div id="modal-root" />
            <div id="toast-root" />
            <div id="clerk-captcha" />
          </ToastProvider>
        </NotificationProvider>

        {/* Defer JavaScript loading for better performance */}
        <Script src="/ainext-template/assets/js/jquery.min.js" strategy="lazyOnload" />
        <Script src="/ainext-template/assets/js/bootstrap.bundle.min.js" strategy="lazyOnload" />
        <Script src="/ainext-template/assets/js/aos.js" strategy="lazyOnload" />
        <Script src="/ainext-template/assets/js/appear.min.js" strategy="lazyOnload" />
        <Script src="/ainext-template/assets/js/odometer.min.js" strategy="lazyOnload" />
        <Script src="/ainext-template/assets/js/owl.carousel.min.js" strategy="lazyOnload" />
        <Script src="/ainext-template/assets/js/ainext.js" strategy="lazyOnload" />
      </body>
    </html>
  )

  // Return with or without ClerkProvider based on configuration
  if (isClerkDisabled) {
    return content
  }

  return (
    <ClerkProvider
      publishableKey={effectiveKey}
      signInUrl="/auth/sign-in"
      signUpUrl="/auth/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/onboarding"
    >
      {content}
    </ClerkProvider>
  )
}
