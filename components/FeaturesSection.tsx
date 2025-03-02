'use client'

import { useRef, useEffect, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, BarChart, FileText, ArrowRight } from 'lucide-react'

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
    <section 
      ref={ref}
      className={`py-20 bg-white transition-opacity duration-1000 ease-in-out ${
        inView ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="container mx-auto px-6">
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
    </section>
  )
}