// app/layout.tsx
'use client'

import './globals.css'
import { Inter } from 'next/font/google'
import { SchoolProvider } from './contexts/OrganizationContext'
import { SidebarProvider } from '@/components/SidebarProvider'
import SupabaseAuthListener from '@/components/SupabaseAuthListener'
import { Analytics } from "@vercel/analytics/react"
import { usePathname } from 'next/navigation'

const inter = Inter({ subsets: ['latin'] })

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
              {children}
            </SidebarProvider>
          </SchoolProvider>
        </SupabaseAuthListener>
        <Analytics />
      </body>
    </html>
  )
}