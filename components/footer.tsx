import Image from 'next/image'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="py-8 bg-soft-white/80 backdrop-blur-sm border-t border-black">
      <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
        <div className="text-black">
          &copy; {new Date().getFullYear()} AlumIntel. All rights reserved.
        </div>
        <div className="flex space-x-6 mt-4 md:mt-0">
          <a href="#" className="text-black hover:text-emerald-600 transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="text-black hover:text-emerald-600 transition-colors">
            Terms of Service
          </a>
          <a href="#" className="text-black hover:text-emerald-600 transition-colors">
            Contact
          </a>
        </div>
      </div>
    </footer>
  )
}

