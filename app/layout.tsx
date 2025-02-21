import './globals.css'
import { Inter } from 'next/font/google'
import { Amplify } from 'aws-amplify'
import type { ResourcesConfig } from 'aws-amplify'
import { SchoolProvider } from './contexts/SchoolContext'

const inter = Inter({ subsets: ['latin'] })

// AWS Cognito Configuration
const config: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID!,
      userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID!,
      loginWith: {
        username: true
      }
    }
  }
};

Amplify.configure(config);

import './aws-config'
console.log('Layout: Finished importing aws-config');
import { SidebarProvider } from '@/components/SidebarProvider'

export const metadata = {
  title: 'AlumIntel - Alumni Engagement Platform',
  description: 'Transform your alumni engagement with AlumIntel',
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



