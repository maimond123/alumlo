'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useState } from 'react'
import Image from 'next/image'

export default function Navigation() {
  const [referralCode, setReferralCode] = useState('')

  const handleDemo = () => {
    // Will implement referral code functionality later
    console.log('Using referral code:', referralCode)
    // For now, just scroll down
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    })
  }

  return (
    <nav className="fixed w-full z-50 px-6 py-4 bg-soft-white/80 backdrop-blur-sm mt-4 border-t border-b border-black">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-black text-4xl font-bold flex items-center">
          AlumIntel
          <Image 
            src="/assets/icons8-atom-48.png"
            alt="AlumIntel Logo"
            width={48}
            height={48}
            className="ml-2"
          />
        </Link>
        
        <div className="flex items-center space-x-4">
          <Link href="/signin">
            <button className="text-black bg-transparent border border-black rounded-full px-4 py-2 hover:bg-black hover:text-white transition-colors">
              Sign In
            </button>
          </Link>
          <Link href="/signup">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-teal-500 text-white px-10 py-4 text-xl rounded-full hover:bg-teal-600 transition-colors"
            >
              Get Started
            </motion.button>
          </Link>
          <div className="flex items-center">
            <input
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              placeholder="Enter referral code"
              className="px-4 py-3 rounded-l-full border-2 border-teal-500 border-r-0 focus:outline-none w-64"
            />
            <button 
              onClick={handleDemo}
              className="bg-teal-500 text-white px-8 py-3 rounded-r-full text-lg font-semibold hover:bg-teal-600 transition-colors border-2 border-teal-500"
            >
              Demo Now
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
