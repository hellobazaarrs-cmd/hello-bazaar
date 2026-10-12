import { DM_Sans, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { ChunkLoadErrorHandler } from '@/components/chunk-load-error-handler'
import { Providers } from './providers'
import AppLockWrapper from '@/components/site/app-lock-wrapper'
import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { DelayedScript } from '@/components/site/delayed-script'

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-sans' })
const jakartaSans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-display' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })


export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://HelloBazaars.com'),
  title: 'Hello Bazaar - B2B Wholesale Portal',
  description: 'Hello Bazaar B2B Wholesale Portal. Electronics and accessories at wholesale prices.',
  icons: { icon: '/favicon.ico', shortcut: '/favicon.ico', apple: '/favicon.png' },
  openGraph: {
    title: 'Hello Bazaar',
    description: 'B2B Wholesale Portal',
    images: ['/logo.png'],
  },
}

import { OfflineScreen } from '@/components/site/offline-screen'
import { PermissionPrompt } from '@/components/site/permission-prompt'
import { LiveSupportWidget } from '@/components/site/live-support-widget'
import { AppExitModal } from '@/components/site/app-exit-modal'
import { FlyToCartContainer } from '@/components/site/fly-to-cart'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="google-site-verification" content="IqfNy8pD9Ah3j_0QfRry2YVd9awYR4udKWBu-alfXV4" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Hello Bazaar" />
        {/* Preconnect & DNS-Prefetch for ultra-fast image loading */}
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://m.media-amazon.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://m.media-amazon.com" />
        <link rel="preconnect" href="https://storage.googleapis.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://storage.googleapis.com" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body suppressHydrationWarning className={`${dmSans.variable} ${jakartaSans.variable} ${jetbrainsMono.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false} disableTransitionOnChange>
          <Providers>
            <AppLockWrapper>
              {children}
            </AppLockWrapper>
            <Toaster />
            <ChunkLoadErrorHandler />
            <OfflineScreen />
            <PermissionPrompt />
            <AppExitModal />
            <FlyToCartContainer />
          </Providers>
        </ThemeProvider>
        <DelayedScript />
      </body>
    </html>
  )
}

