"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { InlineWidget } from 'react-calendly'
import { supabase } from '../app/data/supabase'
import { Loader2 } from 'lucide-react'

interface OAuthHandlerProps {
  onComplete?: () => void
}

export default function OAuthHandler({ onComplete }: OAuthHandlerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [showCalendly, setShowCalendly] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        console.log('[DEBUG] OAuth Handler: Starting callback handling')
        
        // Handle the OAuth callback by getting session from URL
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        console.log('[DEBUG] OAuth Handler: Session data:', session)
        console.log('[DEBUG] OAuth Handler: Session error:', sessionError)
        
        if (sessionError) {
          console.error('[DEBUG] OAuth Handler: Session error:', sessionError)
          setError('Authentication failed. Please try again.')
          setIsLoading(false)
          return
        }

        if (!session || !session.user) {
          console.log('[DEBUG] OAuth Handler: No session found, redirecting to signin')
          router.push('/signin')
          return
        }

        console.log('[DEBUG] OAuth Handler: Valid session found, checking user status')

        // Check if this is a new user by calling our API
        const response = await fetch('/api/oauth-callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user: session.user,
            session: session
          })
        })

        const result = await response.json()
        console.log('[DEBUG] OAuth Handler: API response:', result)

        if (!response.ok) {
          setError(result.error || 'Failed to complete authentication setup')
          setIsLoading(false)
          return
        }

        // If this is a new user, show Calendly
        if (result.isNewUser) {
          console.log('[DEBUG] OAuth Handler: New user detected, showing Calendly')
          setShowCalendly(true)
          setIsLoading(false)
        } else {
          console.log('[DEBUG] OAuth Handler: Existing user, redirecting to dashboard')
          // Existing user, redirect to dashboard
          if (onComplete) onComplete()
          router.push('/dashboard')
        }

      } catch (err) {
        console.error('OAuth callback error:', err)
        setError('An unexpected error occurred during authentication')
        setIsLoading(false)
      }
    }

    handleOAuthCallback()
  }, [router, onComplete])

  const handleCalendlyClose = () => {
    setShowCalendly(false)
    if (onComplete) onComplete()
    router.push('/dashboard')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-white">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-emerald-600" />
          <p className="text-gray-600">Setting up your account...</p>
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto p-6"
        >
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-600">{error}</p>
          </div>
          <button
            onClick={() => router.push('/signin')}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Return to Sign In
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <>
      {showCalendly && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg w-full max-w-2xl h-[700px] overflow-hidden relative border-2 border-black"
          >
            <div className="absolute top-4 left-4 right-4 z-10 bg-white/95 backdrop-blur-sm rounded-lg p-4">
              <h2 className="text-xl font-bold text-center text-black">Welcome to Alumlo!</h2>
              <p className="text-center text-gray-600 text-sm mt-1">
                Let's schedule a quick demo to get you started with your alumni data
              </p>
            </div>
            <button 
              onClick={handleCalendlyClose}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 z-20 p-1 bg-white rounded-full border-2 border-black"
              aria-label="Skip and go to dashboard"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
              </svg>
            </button>
            <div className="pt-16">
              <InlineWidget 
                url="https://calendly.com/david-alumlo/alumlo-demo"
                styles={{ height: 'calc(100% - 4rem)', width: '100%' }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  )
} 