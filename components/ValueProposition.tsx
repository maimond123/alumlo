'use client'

import { useInView } from 'react-intersection-observer'
import Link from 'next/link'

export default function ValueProposition() {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true
  })

  return (
    <section 
      ref={ref}
      className={`py-20 bg-gradient-to-br from-emerald-50 to-teal-50 transition-opacity duration-1000 ease-in-out ${
        inView ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold text-center text-emerald-800 mb-16">
          Transforming Alumni Data into Institutional Value
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          <div className="bg-white rounded-xl shadow-md p-8 transform transition-transform hover:scale-105">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Enhanced Marketing</h3>
            <p className="text-gray-600">
              Showcase your institution's success with compelling data about alumni outcomes, career paths, and achievements.
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-8 transform transition-transform hover:scale-105">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Improved Alumni Engagement</h3>
            <p className="text-gray-600">
              Build stronger connections with your alumni network by understanding their career paths and creating targeted outreach.
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-8 transform transition-transform hover:scale-105">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Data-Driven Decisions</h3>
            <p className="text-gray-600">
              Make informed strategic decisions about curriculum, programs, and resources based on real alumni outcomes.
            </p>
          </div>
        </div>
        
        <div className="mt-16 text-center">
          <Link href="/signup">
            <button className="bg-emerald-600 text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-emerald-700 transition-colors">
              Start Your Free Trial
            </button>
          </Link>
        </div>
      </div>
    </section>
  )
}