// app/client-layout.tsx
'use client'

import { OrganizationProvider } from './contexts/OrganizationContext'
import { SidebarProvider } from '@/components/SidebarProvider'
import SupabaseAuthListener from '@/components/SupabaseAuthListener'
import MixpanelAnalytics from '../components/MixpanelAnalytics'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SupabaseAuthListener>
      <OrganizationProvider>
        <SidebarProvider>
          <MixpanelAnalytics />
          {children}
        </SidebarProvider>
      </OrganizationProvider>
    </SupabaseAuthListener>
  )
}