// app/layout.tsx
'use client'

import './globals.css'
import { Inter } from 'next/font/google'
import { OrganizationProvider } from './contexts/OrganizationContext'
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
  // Routes that should NOT have any scaling (body will be 100vw/vh)
  const noScaleRoutes = ['/data-insights', '/upload-data', '/reports'] 

  let bodyClassName = inter.className
  // Apply .no-scale class if the current path is one of the explicitly unscaled routes
  if (noScaleRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    bodyClassName += ' no-scale'
  }

  return (
    <html lang="en">
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