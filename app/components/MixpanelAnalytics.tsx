'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import analytics from '../utils/analytics'
import { getUserEmail } from '../utils/auth'
import { useAuth } from '../../components/AuthProvider'
import { isDemoMode as checkIsDemoMode } from '../utils/demo'

export default function MixpanelAnalytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Get auth status from context
  const { user: authUser, isAuthenticated: contextAuthenticated, isLoading: authLoading } = useAuth();

  // Initialize session recording on mount and identify visitor
  useEffect(() => {
    analytics.initSessionRecording()
    
    // Handle user identification properly to ensure unique visitor tracking
    const setupVisitorTracking = async () => {
      try {
        // Wait for auth to finish loading
        if (authLoading) {
          return;
        }
        
        if (contextAuthenticated) {
          const userEmail = await getUserEmail()
          
          // Check if this is a demo user
          if (checkIsDemoMode()) {
            // For demo users, use a generic identifier
            analytics.identifyUser("demo_user", {
              isDemoUser: true,
              school: "Your Organization"
            });
            return;
          }
          
          if (userEmail) {
            // For non-demo users, use their actual email
            analytics.identifyUser(userEmail, {
              isDemoUser: false,
              appSection: pathname ? pathname : 'unknown'
            })
          }
        } else {
          // For unauthenticated users, just use the visitor ID
          const visitorId = analytics.getVisitorId()
          console.log(`Unauthenticated visitor: ${visitorId}`)
        }
      } catch (error) {
        console.error("Error in visitor identification:", error)
      }
    }
    
    setupVisitorTracking()
  }, [pathname, authLoading, contextAuthenticated])

  // Track page views and route changes
  useEffect(() => {
    if (!pathname) return;
    
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