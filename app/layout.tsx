// app/layout.tsx
import './globals.css'
import { Inter } from 'next/font/google'
import { SchoolProvider } from './contexts/SchoolContext'
import { SidebarProvider } from '@/components/SidebarProvider'
import SupabaseAuthListener from '@/components/SupabaseAuthListener'
import MobileWarning from '@/components/MobileWarning'
import { Analytics } from "@vercel/analytics/react"

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'AlumIntel',
  description: 'Transform your alumni engagement with AlumIntel',
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
  return (
    <html lang="en">
      <body className={inter.className}>
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