'use client'

import './globals.css'
import { Inter } from 'next/font/google'
import { SchoolProvider } from './contexts/SchoolContext'
import './/aws-config';
import { useEffect } from 'react'
import { supabase } from './data/supabase'

const inter = Inter({ subsets: ['latin'] })
console.log('Layout: Finished importing aws-config');

import { SidebarProvider } from '@/components/SidebarProvider'

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
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // Set up Supabase auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log(`Auth state changed: ${event}`, session)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <html lang="en">
      <body className={inter.className}>
        <SchoolProvider>
          <SidebarProvider>
            {children}
          </SidebarProvider>
        </SchoolProvider>
      </body>
    </html>
  )
}