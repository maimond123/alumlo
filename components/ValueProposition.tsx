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
      className={`py-20 bg-white transition-opacity duration-1000 ease-in-out ${
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          <div className="bg-white rounded-xl border border-black p-10 transform transition-transform hover:scale-105">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Enhanced Marketing</h3>
            <p className="text-lg text-gray-600">
              Showcase your institution's success with compelling data about alumni outcomes, career paths, and achievements.
            </p>
          </div>
          
          <div className="bg-white rounded-xl border border-black p-10 transform transition-transform hover:scale-105">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Improved Alumni Engagement</h3>
            <p className="text-lg text-gray-600">
              Build stronger connections with your alumni network by understanding their career paths and creating targeted outreach.
            </p>
          </div>
          
          <div className="bg-white rounded-xl border border-black p-10 transform transition-transform hover:scale-105">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Data-Driven Decisions</h3>
            <p className="text-lg text-gray-600">
              Make informed strategic decisions about curriculum, programs, and resources based on real alumni outcomes.
            </p>
          </div>
        </div>
        
        <div className="mt-16 text-center">
          <Link href="/signup">
            <button className="bg-teal-500 text-white px-10 py-4 text-xl rounded-full hover:bg-teal-600 transition-colors">
              Get Started
            </button>
          </Link>
        </div>
      </div>
    </section>
  )
}