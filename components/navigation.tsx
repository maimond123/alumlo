'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { supabase } from '../app/data/supabase'

// ... existing code ...
import { useRouter } from 'next/navigation'


export default function Navigation() {
  const router = useRouter()

  const handleGetStarted = async () => {
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
      console.error('Get Started login error:', err)
      
      // Fallback - if login fails, still redirect to dashboard
      router.push('/dashboard')
    }
  }

  return (
    <nav className="fixed top-0 w-full z-50 px-6 py-3 bg-white">
      <div className="container mx-auto flex justify-between items-center">
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
            className="bg-white text-black border-2 border-black px-9 py-2.5 text-lg rounded-full hover:bg-gray-100 transition-colors duration-300"
          >
            Sign In
          </motion.button>
          <motion.button
            onClick={handleGetStarted}
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
