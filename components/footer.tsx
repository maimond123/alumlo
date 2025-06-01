import Image from 'next/image'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="py-8 bg-soft-white/80 backdrop-blur-sm border-t border-gray-300">
      <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
        <div className="text-black">
          &copy; {new Date().getFullYear()} Alumlo. All rights reserved.
        </div>
        <div className="mt-4 md:mt-0">
          <span className="text-black">Contact Us @ david@alumlo.com</span>
        </div>
      </div>
    </footer>
  )
}

