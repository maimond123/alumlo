'use client'

import { useRef, useEffect, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, BarChart, FileText, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'

export default function FeaturesSection() {
  const [activeFeature, setActiveFeature] = useState(0)
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true
  })

  useEffect(() => {
    // Auto-rotate through features
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3)
    }, 7000)
    
    return () => clearInterval(interval)
  }, [])

  const features = [
    {
      id: 'search',
      title: 'Natural Language Alumni Search',
      description: 'Find any alumni with conversational queries like "Who works at Google in AI?" and connect directly to their LinkedIn profiles. Our advanced AI understands complex questions and delivers precise results instantly.',
      icon: <Search className="w-12 h-12 text-emerald-600" />,
      imageSrc: '/placeholder-search.png', // Replace with actual screenshot
      color: 'from-amber-50 to-amber-100'
    },
    {
      id: 'visualizations',
      title: 'AI-Powered Data Visualizations',
      description: 'Explore interactive charts with AI-generated insights that explain trends and patterns in your alumni network. Uncover hidden connections and opportunities that traditional analytics might miss.',
      icon: <BarChart className="w-12 h-12 text-emerald-600" />,
      imageSrc: '/placeholder-visualization.png', // Replace with actual screenshot
      color: 'from-emerald-50 to-emerald-100'
    },
    {
      id: 'reports',
      title: 'Beautiful Downloadable Reports',
      description: 'Generate professional reports with just a few clicks to share with stakeholders or use in marketing materials. Customize layouts, colors, and content to match your institution\'s branding.',
      icon: <FileText className="w-12 h-12 text-emerald-600" />,
      imageSrc: '/placeholder-report.png', // Replace with actual screenshot
      color: 'from-blue-50 to-blue-100'
    }
  ]

  const nextFeature = () => {
    setActiveFeature((prev) => (prev + 1) % features.length)
  }

  const prevFeature = () => {
    setActiveFeature((prev) => (prev - 1 + features.length) % features.length)
  }

  const currentFeature = features[activeFeature]

  return (
    <section 
      ref={ref}
      className={`py-20 bg-white transition-opacity duration-1000 ease-in-out ${
        inView ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold text-emerald-700 mb-12 text-center">Powerful Features for Schools</h2>
        
        <div className="relative">
          {/* Feature Navigation */}
          <div className="flex justify-center mb-8">
            <div className="flex space-x-2">
              {features.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveFeature(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === activeFeature ? 'bg-emerald-600 scale-125' : 'bg-emerald-200'
                  }`}
                  aria-label={`Go to feature ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Feature Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Feature Description */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFeature}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col"
              >
                <div className={`p-2 rounded-full w-20 h-20 flex items-center justify-center bg-gradient-to-br ${currentFeature.color} mb-6`}>
                  {currentFeature.icon}
                </div>
                <h3 className="text-2xl font-bold text-emerald-800 mb-4">{currentFeature.title}</h3>
                <p className="text-lg text-emerald-700 mb-6">{currentFeature.description}</p>
                <button className="flex items-center text-emerald-600 font-semibold hover:text-emerald-800 transition-colors w-fit">
                  Learn more <ArrowRight className="ml-2 w-5 h-5" />
                </button>
              </motion.div>
            </AnimatePresence>

            {/* Feature Demo/Visualization */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFeature}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5 }}
                className={`bg-gradient-to-br ${currentFeature.color} rounded-xl p-6 shadow-lg aspect-video flex items-center justify-center`}
              >
                {/* Replace with actual demo content */}
                <div className="text-center">
                  <div className="mb-4 opacity-80">Interactive Demo</div>
                  <div className="w-full h-48 bg-white/50 rounded-lg flex items-center justify-center">
                    {currentFeature.icon}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Arrows */}
          <div className="flex justify-between absolute top-1/2 -translate-y-1/2 w-full left-0 px-4 pointer-events-none">
            <button 
              onClick={prevFeature}
              className="bg-white/80 hover:bg-white text-emerald-700 p-2 rounded-full shadow-md pointer-events-auto transition-all hover:scale-110"
              aria-label="Previous feature"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={nextFeature}
              className="bg-white/80 hover:bg-white text-emerald-700 p-2 rounded-full shadow-md pointer-events-auto transition-all hover:scale-110"
              aria-label="Next feature"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}