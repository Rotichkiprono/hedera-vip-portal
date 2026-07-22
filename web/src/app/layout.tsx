import type { Metadata, Viewport } from 'next'
import { Barlow } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-barlow',
})

export const metadata: Metadata = {
  title: 'Artist VIP Portal',
  description: 'Exclusive access for verified fans. Your pass unlocks everything behind the curtain.',
  generator: 'v0.app',
  keywords: ['VIP', 'artist', 'exclusive', 'music', 'fan portal'],
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#09090b',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${barlow.variable} bg-background`}>
      <body className="font-sans antialiased flex min-h-dvh flex-col">
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  )
}
