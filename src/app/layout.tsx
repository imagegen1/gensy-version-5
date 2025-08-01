import type { Metadata } from 'next'
import { Inter, Raleway } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { ToastProvider } from '@/components/ui'
import { NotificationProvider } from '@/components/ui/notification-system'
import { getBaseUrl } from '@/lib/utils'
import PerformanceMonitor from '@/components/PerformanceMonitor'
import './globals.css'

// Optimize font loading with display swap for better performance
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true
})

const raleway = Raleway({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-raleway'
})

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
  // Check if we have a valid Clerk key or if we're in build mode
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' ||
                     process.env.CI === 'true' ||
                     process.env.VERCEL === '1'

  // Use a properly formatted test key for build time
  const buildTimeKey = 'pk_test_Y2xlcmsuaW5jbHVkZWQua2F0eWRpZC05Mi5sY2wuZGV2JA'
  const effectiveKey = clerkPublishableKey || buildTimeKey

  return (
    <ClerkProvider
      publishableKey={effectiveKey}
      signInUrl="/auth/sign-in"
      signUpUrl="/auth/sign-up"
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/onboarding"
    >
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="icon" href="/favicon.ico" />
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
          <link rel="manifest" href="/site.webmanifest" />

          {/* Performance optimized CSS loading */}
          {/* Critical CSS - Load immediately */}
          <link rel="preload" href="/ainext-template/assets/css/bootstrap.min.css" as="style" onLoad="this.onload=null;this.rel='stylesheet'" />
          <noscript><link rel="stylesheet" href="/ainext-template/assets/css/bootstrap.min.css" /></noscript>

          <link rel="preload" href="/ainext-template/assets/css/style.css" as="style" onLoad="this.onload=null;this.rel='stylesheet'" />
          <noscript><link rel="stylesheet" href="/ainext-template/assets/css/style.css" /></noscript>

          <link rel="preload" href="/ainext-template/assets/css/responsive.css" as="style" onLoad="this.onload=null;this.rel='stylesheet'" />
          <noscript><link rel="stylesheet" href="/ainext-template/assets/css/responsive.css" /></noscript>

          <link rel="preload" href="/ainext-template/assets/css/remixicon.min.css" as="style" onLoad="this.onload=null;this.rel='stylesheet'" />
          <noscript><link rel="stylesheet" href="/ainext-template/assets/css/remixicon.min.css" /></noscript>

          {/* Non-critical CSS - Load asynchronously */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // Load non-critical CSS asynchronously
                const loadCSS = (href) => {
                  const link = document.createElement('link');
                  link.rel = 'stylesheet';
                  link.href = href;
                  link.media = 'print';
                  link.onload = () => { link.media = 'all'; };
                  document.head.appendChild(link);
                };

                // Load non-critical stylesheets after page load
                window.addEventListener('load', () => {
                  requestIdleCallback(() => {
                    loadCSS('/ainext-template/assets/css/owl.carousel.min.css');
                    loadCSS('/ainext-template/assets/css/owl.theme.default.min.css');
                    loadCSS('/ainext-template/assets/css/odometer.min.css');
                    loadCSS('/ainext-template/assets/css/flaticon.css');
                    loadCSS('/ainext-template/assets/css/aos.css');
                  });
                });
              `
            }}
          />
        </head>
        <body className={`${inter.className} ${raleway.variable}`}>
          {/* Performance monitoring in development */}
          <PerformanceMonitor />

          {/* Critical resource hints */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // Preload critical resources immediately
                const preloadLink = (href, as, type) => {
                  const link = document.createElement('link');
                  link.rel = 'preload';
                  link.href = href;
                  link.as = as;
                  if (type) link.type = type;
                  document.head.appendChild(link);
                };

                // Preload critical assets
                preloadLink('/ainext-template/assets/img/main logo.svg', 'image');
                preloadLink('/ainext-template/assets/js/jquery.min.js', 'script');

                // Add resource hints
                const addHint = (rel, href) => {
                  const link = document.createElement('link');
                  link.rel = rel;
                  link.href = href;
                  document.head.appendChild(link);
                };

                addHint('dns-prefetch', '//fonts.googleapis.com');
                addHint('dns-prefetch', '//fonts.gstatic.com');
              `
            }}
          />

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
        </body>
      </html>
    </ClerkProvider>
  )
}
