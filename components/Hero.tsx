'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../app/data/supabase'
import { motion } from 'framer-motion'

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
        password: "Tryme12!" // Replace with your actual demo password
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
    <section className="relative min-h-[91vh] flex items-center pb-20">
      {/* Fading emerald background element */}
      <div
        className="absolute inset-0 overflow-hidden z-0"
        aria-hidden="true"
      >
        <div
          className="absolute top-1/2 left-1/4 transform -translate-x-1/2 -translate-y-1/2 z-0"
          aria-hidden="true"
          style={{
            width: '100%',
            height: '100%',
            background:
              'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.35) 0%, rgba(16, 185, 129, 0) 70%)',
            filter: 'blur(50px)', 
          }}
        />
      </div>

      <div className={`container mx-auto px-6 relative z-10 transition-all duration-1000 ease-in-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}>
        <h1 className="text-7xl font-bold text-emerald-800 mb-4">
          Alumni Intelligence<br /> 
        </h1>
        
        <p className="text-xl text-emerald-700 mb-8 max-w-2xl">
          Transform outdated alumni databases into actionable marketing insights with our AI-powered search, analytics, and custom reports.
        </p>
        
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <motion.button
            onClick={handleDemoAccess}
            disabled={isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-white text-black border-2 border-black px-10 py-4 text-xl rounded-full hover:bg-gray-100 transition-colors duration-300 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Loading...
              </>
            ) : (
              "Try Now"
            )}
          </motion.button>
        </div>
      </div>
    </section>
  )
}