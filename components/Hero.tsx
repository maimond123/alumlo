'use client'

import { useEffect, useState } from 'react'
import ReferralCodeInput from './RefferalCodeInput'

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

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
          Transform outdated alumni databases into actionable insights with our AI-powered search, analytics, and custom reports.
        </p>
        
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <ReferralCodeInput />
        </div>
      </div>
    </section>
  )
}