import './globals.css'
import './aws-config'
import { Inter } from 'next/font/google'
import { SidebarProvider } from '@/components/SidebarProvider'

const inter = Inter({ subsets: ['latin'] })

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
        <SidebarProvider>
          {children}
        </SidebarProvider>
      </body>
    </html>
  )
}



