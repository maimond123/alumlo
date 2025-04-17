'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import analytics from '../utils/analytics'

export default function MixpanelAnalytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Initialize session recording on mount
  useEffect(() => {
    analytics.initSessionRecording()
  }, [])

  // Track page views and route changes
  useEffect(() => {
    // Get current route with search params
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
    
    // Get page name from path (remove leading slash and params)
    const pageName = pathname.split('/').pop() || 'home'
    
    // Track page view
    analytics.trackPageView(pageName, { url })
    
    // Also reset scroll tracking on new page
    window.scrollTo(0, 0)
  }, [pathname, searchParams])

  // This component doesn't render anything
  return null
} 