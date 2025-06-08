'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { setDemoMode } from '../app/utils/demo'

// ... existing code ...

export default function Navigation() {
  const router = useRouter()

  const handleGetStarted = async () => {
    try {
      // Set demo mode in session storage
      setDemoMode('chick_fil_a', '{Your Organization}')
      
      // Redirect to dashboard - no authentication needed!
      router.push('/dashboard')
    } catch (err) {
      console.error('Demo setup error:', err)
      // Still redirect to dashboard as demo mode is set
      router.push('/dashboard')
    }
  }

  const handleBookDemo = () => {
    window.open("https://calendly.com/david-alumlo/30min", "_blank");
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-3 bg-white">
      <div className="w-full flex justify-between items-center">
        <Link href="/" className="text-black text-[2rem] font-bold flex items-center">
          Alumlo
          <Image 
            src="/assets/icons8-atom-48.png"
            alt="AlumIntel Logo"
            width={40}
            height={40}
            className="ml-2"
          />
        </Link>
        
        <div className="flex items-center space-x-4">
          {/* <Link href="/signin">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-black px-10 py-4 text-xl rounded-full hover:bg-emerald-100 transition-colors border border-black"
            >
              Sign In
            </motion.button>
          </Link> */}
          <motion.button
            onClick={() => router.push('/signin')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-white text-black border border-gray-300 px-9 py-2.5 text-lg rounded-full hover:bg-gray-100 transition-colors duration-300"
          >
            Sign In
          </motion.button>
          <motion.button
            onClick={handleBookDemo}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-yellow-400/30 text-black border-[3px] border-yellow-500 px-9 py-2.5 text-lg rounded-full hover:bg-yellow-400/40 transition-colors duration-300 font-semibold shadow-md shadow-yellow-500/30 hover:shadow-yellow-400/40"
          >
            Book Demo
          </motion.button>
        </div>
      </div>
    </nav>
  )
}