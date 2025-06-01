// app/layout.tsx
'use client'

import './globals.css'
import { Inter } from 'next/font/google'
import { OrganizationProvider } from './contexts/OrganizationContext'
import { SidebarProvider } from '@/components/SidebarProvider'
import SupabaseAuthListener from '@/components/SupabaseAuthListener'
import { Analytics } from "@vercel/analytics/react"
import { usePathname } from 'next/navigation'
import Head from 'next/head'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  let bodyClassName = inter.className

  if (pathname === '/') {
    // Home page: body is unscaled (uses default body style from globals.css)
    // Scaling is handled by .scaled-content-area inside the page
  } else {
    bodyClassName += ' default-scale' // All other pages get the default global scaling
  }

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body className={bodyClassName}>
        <SupabaseAuthListener>
          <OrganizationProvider>
            <SidebarProvider>
              {children}
            </SidebarProvider>
          </OrganizationProvider>
        </SupabaseAuthListener>
        <Analytics />
      </body>
    </html>
  )
}