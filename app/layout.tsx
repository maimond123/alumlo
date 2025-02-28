import './globals.css'
import { Inter } from 'next/font/google'
import { Amplify } from 'aws-amplify'
import type { ResourcesConfig } from 'aws-amplify'
import { SchoolProvider } from './contexts/SchoolContext'
import './/aws-config';

const inter = Inter({ subsets: ['latin'] })
console.log('Layout: Finished importing aws-config');

import { SidebarProvider } from '@/components/SidebarProvider'

export const metadata = {
  title: 'AlumIntel - Alumni Insights Platform',
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