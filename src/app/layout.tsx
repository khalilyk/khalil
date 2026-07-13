import type { Metadata, Viewport } from 'next'
import { Sora, Caveat, Anton } from 'next/font/google'
import './globals.css'

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800'],
})

const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-hand',
  weight: ['400', '500', '600', '700'],
})

// Ultra-condensed heavy display face for the KHALIL wordmark
const anton = Anton({
  subsets: ['latin'],
  variable: '--font-display',
  weight: '400',
})

export const metadata: Metadata = {
  title: 'Khalil',
  description: 'Your full life platform',
  // Private app — keep it out of every search index
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Khalil' },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#EA5A0C',
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable} ${caveat.variable} ${anton.variable}`}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}
