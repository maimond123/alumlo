'use client'

import { useEffect, useState } from 'react'
import ReferralCodeInput from './RefferalCodeInput'

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false)
  const [showExplore, setShowExplore] = useState(true)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleScroll = () => {
    const exploreElement = document.getElementById('explore-more')
    if (exploreElement) {
      const rect = exploreElement.getBoundingClientRect()
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        setShowExplore(false)
      }
    }
  }

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <section className="relative min-h-screen flex items-center">
      <div className={`container mx-auto px-6 relative z-10 transition-all duration-1000 ease-in-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}>
        <h1 className="text-7xl font-bold text-emerald-800 mb-4">
          Alumni Intelligence<br />
          for Schools<span className="text-teal-500">.</span>
        </h1>
        
        <p className="text-xl text-emerald-700 mb-8 max-w-2xl">
          Empower your institution with powerful data visualizations and AI-driven insights to unlock the full potential of your alumni network.
        </p>
        
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <ReferralCodeInput />
        </div>
      </div>

      {showExplore && (
        <div id="explore-more" className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-center">
          <p className="text-black text-lg mb-2">Explore More</p>
          <svg className="w-8 h-8 text-teal-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m0 0l-4-4m4 4l4-4" />
          </svg>
        </div>
      )}
    </section>
  )
}