import Image from 'next/image'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="py-8 bg-soft-white/80 backdrop-blur-sm border-t border-black">
      <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
        <div className="text-black">
          &copy; {new Date().getFullYear()} AlumIntel. All rights reserved.
        </div>
        <div className="mt-4 md:mt-0">
          <span className="text-black">Contact Us @ david@alumintel.com</span>
        </div>
      </div>
    </footer>
  )
}

