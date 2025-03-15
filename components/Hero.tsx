'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false)
  const [referralCode, setReferralCode] = useState('')

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

  const handleDemo = () => {
    // Will implement referral code functionality later
    console.log('Using referral code:', referralCode)
    // For now, just scroll down
    scrollDown()
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
          <div className="flex flex-1 sm:flex-initial sm:w-auto">
            <input
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              placeholder="Enter referral code"
              className="px-4 py-3 rounded-l-full border-2 border-teal-500 border-r-0 focus:outline-none w-full sm:w-64"
            />
            <button 
              onClick={handleDemo}
              className="bg-teal-500 text-white px-8 py-3 rounded-r-full text-lg font-semibold hover:bg-teal-600 transition-colors border-2 border-teal-500"
            >
              Demo Now
            </button>
          </div>
          
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