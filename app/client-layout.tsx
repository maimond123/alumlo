// app/client-layout.tsx
'use client'

import { SchoolProvider } from './contexts/OrganizationContext'
import { SidebarProvider } from '@/components/SidebarProvider'
import SupabaseAuthListener from '@/components/SupabaseAuthListener'
import MixpanelAnalytics from './components/MixpanelAnalytics'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SupabaseAuthListener>
      <SchoolProvider>
        <SidebarProvider>
          <MixpanelAnalytics />
          {children}
        </SidebarProvider>
      </SchoolProvider>
    </SupabaseAuthListener>
  )
}