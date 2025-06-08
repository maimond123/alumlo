'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function DemoPage() {
  const router = useRouter()

  useEffect(() => {
    // Set demo mode in session storage
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('demoMode', 'true')
      sessionStorage.setItem('demoOrganization', 'chick_fil_a')
      sessionStorage.setItem('demoDisplayName', '{Your Organization}')
      
      // Redirect to dashboard after a brief delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md mx-4"
      >
        <div className="mb-6">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to Alumlo Demo
          </h1>
          <p className="text-gray-600">
            Setting up your demo experience...
          </p>
        </div>
        
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
        
        <p className="text-sm text-gray-500 mt-4">
          You'll be redirected to the dashboard shortly
        </p>
      </motion.div>
    </div>
  )
} 