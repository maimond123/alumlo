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
import { AuthProvider } from "../components/AuthProvider"

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // Remove all scaling logic - use consistent styling across all pages
  const bodyClassName = inter.className

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body className={bodyClassName}>
        <SupabaseAuthListener>
          <AuthProvider>
            <OrganizationProvider>
              <SidebarProvider>
                {children}
              </SidebarProvider>
            </OrganizationProvider>
          </AuthProvider>
        </SupabaseAuthListener>
        <Analytics />
      </body>
    </html>
  )
}