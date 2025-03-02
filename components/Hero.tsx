'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, BarChart, FileText, ArrowRight } from 'lucide-react'

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)

  useEffect(() => {
    setIsVisible(true)
    
    // Auto-rotate through features
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3)
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])

  const features = [
    {
      id: 'search',
      title: 'Natural Language Alumni Search',
      description: 'Find any alumni with conversational queries like "Who works at Google in AI?" and connect directly to their LinkedIn profiles.',
      icon: <Search className="w-8 h-8 text-emerald-600" />,
      imageSrc: '/placeholder-search.png', // Replace with actual screenshot
      color: 'from-amber-50 to-amber-100'
    },
    {
      id: 'visualizations',
      title: 'AI-Powered Data Visualizations',
      description: 'Explore interactive charts with AI-generated insights that explain trends and patterns in your alumni network.',
      icon: <BarChart className="w-8 h-8 text-emerald-600" />,
      imageSrc: '/placeholder-visualization.png', // Replace with actual screenshot
      color: 'from-emerald-50 to-emerald-100'
    },
    {
      id: 'reports',
      title: 'Beautiful Downloadable Reports',
      description: 'Generate professional reports with just a few clicks to share with stakeholders or use in marketing materials.',
      icon: <FileText className="w-8 h-8 text-emerald-600" />,
      imageSrc: '/placeholder-report.png', // Replace with actual screenshot
      color: 'from-blue-50 to-blue-100'
    }
  ]

  return (
    <>
      {/* Main Hero Section */}
      <section className="relative min-h-screen flex items-center">
        <div className={`container mx-auto px-6 relative z-10 transition-all duration-1000 ease-in-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <h1 className="text-7xl font-bold text-emerald-800 mb-4">
            Alumni Intelligence<br />
            for Schools<span className="text-teal-500">.</span>
          </h1>
          
          <p className="text-xl text-emerald-700 mb-8 max-w-2xl">
            Transform how you understand, engage with, and showcase your alumni network with powerful search, visualizations, and reports.
          </p>
          
          <div className="mb-12">
            <Link href="/signup">
              <button className="bg-teal-500 text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-teal-600 transition-colors">
                Discover Your Data
              </button>
            </Link>
          </div>
          
          {/* Animated Feature Showcase */}
          <div className="mt-16 mb-24">
            <h2 className="text-3xl font-bold text-emerald-700 mb-12 text-center">Powerful Features for Schools</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.id}
                  className={`cursor-pointer rounded-xl p-6 ${index === activeFeature ? `bg-gradient-to-br ${feature.color} shadow-lg` : 'bg-white'} 
                    transition-all duration-300 hover:shadow-md`}
                  onClick={() => setActiveFeature(index)}
                  whileHover={{ y: -5 }}
                >
                  <div className="flex items-center mb-4">
                    {feature.icon}
                    <h3 className="text-xl font-semibold ml-3 text-gray-800">{feature.title}</h3>
                  </div>
                  <p className="text-gray-600 mb-4">{feature.description}</p>
                  
                  {index === activeFeature && (
                    <div className="flex items-center text-emerald-600 font-medium">
                      <span>Learn more</span>
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
            
            {/* Feature Preview */}
            <AnimatePresence mode="wait">
              <motion.div 
                key={features[activeFeature].id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-xl shadow-xl overflow-hidden max-w-5xl mx-auto"
              >
                <div className="p-6 bg-gray-50 border-b">
                  <h3 className="text-2xl font-bold text-gray-800 flex items-center">
                    {features[activeFeature].icon}
                    <span className="ml-3">{features[activeFeature].title}</span>
                  </h3>
                </div>
                
                <div className="relative aspect-video w-full bg-gray-100">
                  {/* Replace with actual screenshots */}
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <p className="text-center">
                      Feature preview image<br />
                      <span className="text-sm">(Replace with actual screenshot)</span>
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>
      
      {/* Value Proposition Section */}
      <section className="py-20 bg-gradient-to-br from-emerald-50 to-teal-50">
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
    </>
  )
}


