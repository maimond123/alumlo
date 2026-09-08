'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 25, y: 50 }) // Default to left-1/4, top-1/2
  const heroRef = useRef<HTMLElement>(null)
  const router = useRouter()

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!heroRef.current) return

    const rect = heroRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = Math.min(((e.clientY - rect.top) / rect.height) * 100, 75) // Limit to top 75% of the page
    
    setMousePosition({ x, y })
  }

  const handleDemoAccess = () => {
    router.push('/search')
  }

  return (
    <section 
      ref={heroRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen flex items-center pb-20"
    >
      {/* Fading emerald background element */}
      <div
        className="absolute inset-0 overflow-hidden z-0"
        aria-hidden="true"
      >
        <div
          className="absolute inset-0 transition-all duration-300 ease-out"
          aria-hidden="true"
          style={{
            background:
              `radial-gradient(ellipse at ${mousePosition.x}% ${mousePosition.y}%, rgba(16, 185, 129, 0.35) 0%, rgba(16, 185, 129, 0) 70%)`,
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
        Search and learn about your alumni. Unparalleled access and insight to market your alumni's success.
        </p>
        
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <motion.button
            onClick={handleDemoAccess}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-white text-black border border-gray-300 px-10 py-4 text-xl rounded-full hover:bg-gray-100 transition-colors duration-300 flex items-center justify-center"
          >
            Try Now
          </motion.button>
        </div>
      </div>
    </section>
  )
}