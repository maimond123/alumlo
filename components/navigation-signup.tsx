'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import Image from 'next/image'

export default function Navigation() {
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
        
        <Link href="/">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-teal-500 text-white px-10 py-4 text-xl rounded-full hover:bg-teal-600 transition-colors"
          >
            Back
          </motion.button>
        </Link>
      </div>
    </nav>
  )
}
