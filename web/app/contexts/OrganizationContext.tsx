"use client"

import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

export interface Tenant {
  /** Identifies the tenant to /api/search. 'demo', 'chick_fil_a'. */
  slug: string
  /** What the UI renders. 'Chick-fil-A'. */
  name: string
  /** How many profiles the tenant has, for the search page's result copy. */
  profileCount: number
}

interface OrganizationContextType {
  tenant: Tenant | null
  isLoading: boolean
  error: string | null
}

const OrganizationContext = createContext<OrganizationContextType>({
  tenant: null,
  isLoading: true,
  error: null
})

const DEFAULT_TENANT_SLUG = 'demo'

/**
 * Resolves which tenant the session is looking at.
 *
 * This replaces a Supabase lookup that mapped the signed-in user's email to a
 * row in customer_information. There are no accounts now, so the slug comes
 * from ?tenant= and defaults to 'demo'. The slug and the display name are kept
 * apart because they are different values: the 2025 code derived one from the
 * other by lowercasing and underscoring, which is what migration 002 removed.
 */
export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const slug =
      new URLSearchParams(window.location.search).get('tenant') ||
      DEFAULT_TENANT_SLUG

    fetch(`/api/tenants?slug=${encodeURIComponent(slug)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Unknown tenant "${slug}"`)
        setTenant(await res.json())
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <OrganizationContext.Provider value={{ tenant, isLoading, error }}>
      {children}
    </OrganizationContext.Provider>
  )
}

export const useOrganization = () => useContext(OrganizationContext)
