// app/layout.tsx
'use client'


import './globals.css'
import { Inter } from 'next/font/google'
import { OrganizationProvider } from './contexts/OrganizationContext'
import { SidebarProvider } from '@/components/SidebarProvider'
import { Analytics } from "@vercel/analytics/react"

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body className={inter.className}>
        <OrganizationProvider>
          <SidebarProvider>
            {children}
          </SidebarProvider>
        </OrganizationProvider>
        <Analytics />
      </body>
    </html>
  )
}