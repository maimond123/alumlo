'use client'

import { useInView } from 'react-intersection-observer'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function ValueProposition() {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false
  })

  // State to track if animation has started
  const [animationStarted, setAnimationStarted] = useState(false)
  
  // Start animation when section comes into view
  useEffect(() => {
    if (inView) {
      setAnimationStarted(true)
    } else {
      // Reset animation when out of view
      setAnimationStarted(false)
    }
  }, [inView])

  return (
    <section 
      ref={ref}
      className={`pt-32 pb-20 bg-white transition-opacity duration-1000 ease-in-out ${
        inView ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="container mx-auto px-6">
        {/* Custom animation styles */}
        <style jsx>{`
          @keyframes unblurText {
            0% {
              filter: blur(12px);
              opacity: 0;
            }
            100% {
              filter: blur(0);
              opacity: 1;
            }
          }
          
          .text-reveal {
            display: inline-block;
            animation: unblurText 1.5s forwards;
            opacity: 0;
          }
          
          .word-container {
            display: inline-block;
            overflow: hidden;
          }
          
          .word-1 { animation-delay: 0.1s; }
          .word-2 { animation-delay: 0.3s; }
          .word-3 { animation-delay: 0.5s; }
          .word-4 { animation-delay: 0.7s; }
          .word-5 { animation-delay: 0.9s; }
        `}</style>
        
        <h2 className="text-4xl font-bold text-center text-black mb-24">
          {animationStarted ? (
            <>
              <span className="word-container"><span className="text-reveal word-1">Transforming</span></span>{' '}
              <span className="word-container"><span className="text-reveal word-2">Alumni</span></span>{' '}
              <span className="word-container"><span className="text-reveal word-3">Data</span></span>{' '}
              <span className="word-container"><span className="text-reveal word-4">into</span></span>{' '}
              <span className="word-container"><span className="text-reveal word-5">Institutional</span></span>{' '}
              <span className="word-container"><span className="text-reveal word-5">Value</span></span>
            </>
          ) : (
            <span className="opacity-0">Transforming Alumni Data into Institutional Value</span>
          )}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Value 1: New Alumni Database */}
          <div className="bg-white rounded-xl border border-black p-10 transform transition-transform hover:scale-105">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6M12 17v-2M15 17v-4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">New Alumni Database</h3>
            <p className="text-lg text-gray-600">
              Reinvigorate your outdated alumni records with our comprehensive, always up-to-date database that captures career progression, location changes, and professional achievements automatically.
            </p>
          </div>
          
          {/* Value 2: Customizable School Insights Report */}
          <div className="bg-white rounded-xl border border-black p-10 transform transition-transform hover:scale-105">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Customizable School Insights Report</h3>
            <p className="text-lg text-gray-600">
              Receive professionally designed reports tailored to your institution's unique needs, highlighting alumni success stories and addressing school-specific challenges with actionable insights.
            </p>
          </div>
          
          {/* Value 3: Alumni Search and Analytics */}
          <div className="bg-white rounded-xl border border-black p-10 transform transition-transform hover:scale-105">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Alumni Search and Analytics</h3>
            <p className="text-lg text-gray-600">
              Empower your team with natural language search capabilities and aggregate analytics that reveal patterns across industries, locations, and career paths of your alumni network.
            </p>
          </div>
          
          {/* Value 4: Fundraising and Networking */}
          <div className="bg-white rounded-xl border border-black p-10 transform transition-transform hover:scale-105">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Fundraising and Networking</h3>
            <p className="text-lg text-gray-600">
              Strengthen donor relationships and facilitate student mentorship connections by identifying alumni with shared interests, creating targeted outreach opportunities and meaningful networking.
            </p>
          </div>
        </div>
        
        <div className="mt-16 text-center">
          <Link href="/signup">
            <button className="bg-teal-500 text-white px-10 py-4 text-xl rounded-full hover:bg-teal-600 transition-colors transform transition-transform hover:scale-105">
              Start Today
            </button>
          </Link>
        </div>
      </div>
    </section>
  )
}