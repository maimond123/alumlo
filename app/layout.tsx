// app/layout.tsx
'use client'

import './globals.css'
import { Inter } from 'next/font/google'
import { SchoolProvider } from './contexts/SchoolContext'
import { SidebarProvider } from '@/components/SidebarProvider'
import SupabaseAuthListener from '@/components/SupabaseAuthListener'
import MobileWarning from '@/components/MobileWarning'
import { Analytics } from "@vercel/analytics/react"
import { usePathname } from 'next/navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Alumlo',
  description: 'Transform your alumni engagement with Alumlo',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png' },
    ],
    shortcut: [
      { url: '/favicon.ico' }
    ]
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const noScaleRoutes = ['/data-insights', '/upload-data', '/reports']
  const shouldApplyNoScale = noScaleRoutes.some(route => pathname.startsWith(route))

  let bodyClassName = inter.className
  if (shouldApplyNoScale) {
    bodyClassName += ' no-scale'
  }

  return (
    <html lang="en">
      <body className={bodyClassName}>
        <SupabaseAuthListener>
          <SchoolProvider>
            <SidebarProvider>
              <MobileWarning />
              {children}
            </SidebarProvider>
          </SchoolProvider>
        </SupabaseAuthListener>
        <Analytics />
      </body>
    </html>
  )
}