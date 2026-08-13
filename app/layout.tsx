import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { ScheduleProvider } from '@/components/schedule-provider'
import { AuthProvider } from '@/hooks/use-auth'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-ios',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Dormosaur — Dorm life, decoded.',
  description:
    'Dormosaur turns a messy pasted class schedule into a beautiful timetable with auto-synced alarms, plus dorm-friendly recipes for tiny kitchens.',
  generator: 'v0.app',
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#F9F9FB',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} bg-background`}>
      <body className="font-sans antialiased">
        <AuthProvider>
          <ThemeProvider>
            <ScheduleProvider>{children}</ScheduleProvider>
          </ThemeProvider>
        </AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
