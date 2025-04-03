'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../app/data/supabase'

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleDemoAccess = async () => {
    setIsLoading(true)
    
    try {
      // Sign in as the demo account
      const { data, error } = await supabase.auth.signInWithPassword({
        email: "maimondavid553@gmail.com",
        password: process.env.ADMIN_PASSWORD || 'Tryme12!'
      });
      
      if (error) throw error;
      
      // Redirect to dashboard after successful login
      router.push('/dashboard')
    } catch (err) {
      console.error('Demo login error:', err)
      
      // Fallback - if login fails, still redirect to dashboard
      // The dashboard has logic to detect demo mode
      router.push('/dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="relative min-h-[91vh] flex items-center">
      <div className={`container mx-auto px-6 relative z-10 transition-all duration-1000 ease-in-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}>
        <h1 className="text-7xl font-bold text-emerald-800 mb-4">
          Alumni Intelligence<br />
          for Schools<span className="text-teal-500">.</span>
        </h1>
        
        <p className="text-xl text-emerald-700 mb-8 max-w-2xl">
          Transform outdated alumni databases into actionable marketing insights with our AI-powered search, analytics, and custom reports.
        </p>
        
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <button
            onClick={handleDemoAccess}
            disabled={isLoading}
            className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-full text-lg transition-colors duration-300 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Loading...
              </>
            ) : (
              "Demo Now"
            )}
          </button>
        </div>
      </div>
    </section>
  )
}