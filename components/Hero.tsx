'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const scrollDown = () => {
    // Scroll down by approximately one viewport height
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    })
  }

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
          <button 
            onClick={scrollDown}
            className="bg-transparent text-teal-500 px-8 py-3 rounded-full text-lg font-semibold hover:bg-teal-50 transition-colors border-2 border-teal-500"
          >
            Learn More
          </button>
        </div>
      </div>
    </section>
  )
}