'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export default function Navigation() {
  return (
    <nav className="fixed w-full z-50 px-6 py-4 bg-soft-white/80 backdrop-blur-sm mt-4 border-t border-b border-black">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-black text-4xl font-bold flex items-center">
          AlumIntel
        </Link>
        
        <div className="flex items-center space-x-4">
          <Link href="/signin">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-black px-10 py-4 text-xl rounded-full hover:bg-emerald-100 transition-colors border border-black"
            >
              Sign In
            </motion.button>
          </Link>
          <Link href="/signup">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-teal-500 text-white px-10 py-4 text-xl rounded-full hover:bg-teal-600 transition-colors"
            >
              Sign Up
            </motion.button>
          </Link>
        </div>
      </div>
    </nav>
  )
}
