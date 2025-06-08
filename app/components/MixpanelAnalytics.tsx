'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import analytics from '../utils/analytics'
import { getUserEmail } from '../utils/auth'
import { useAuth } from '../../components/AuthProvider'

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
          
          // If this is the demo user, use the unique visitor ID in analytics
          // while still associating with the demo account data
          if (userEmail === "maimondavid553@gmail.com") {
            const visitorId = analytics.getVisitorId()
            console.log(`MixpanelAnalytics: Demo visitor identified with ID: ${visitorId}`)
            
            // Use the demo email for data queries but the visitor ID for analytics
            analytics.identifyUser("maimondavid553@gmail.com", {
              isDemoUser: true,
              visitorId: visitorId,
              school: "Your School", 
              appSection: pathname ? pathname : 'unknown'
            })
          } else if (userEmail) {
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