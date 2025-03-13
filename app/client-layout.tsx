// app/client-layout.tsx
'use client'

import { SchoolProvider } from './contexts/SchoolContext'
import { SidebarProvider } from '@/components/SidebarProvider'
import SupabaseAuthListener from '@/components/SupabaseAuthListener'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SupabaseAuthListener>
      <SchoolProvider>
        <SidebarProvider>
          {children}
        </SidebarProvider>
      </SchoolProvider>
    </SupabaseAuthListener>
  )
}