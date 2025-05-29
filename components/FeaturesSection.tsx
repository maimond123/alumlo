'use client'

import { useRef, useEffect, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, FileText, ArrowRight, ChevronLeft, ChevronRight, Search, Check, UserCircle } from 'lucide-react'
import Image from 'next/image'

export default function FeaturesSection() {
  // Create separate refs for each section
  const { ref: visualizationsRef, inView: visualizationsInView } = useInView({
    threshold: 0.1,
    triggerOnce: true
  })
  
  const { ref: reportsRef, inView: reportsInView } = useInView({
    threshold: 0.1,
    triggerOnce: true
  })

  // Demo state for visualization feature
  const [activeChart, setActiveChart] = useState(0)
  
  // Demo state for reports feature
  const [reportPage, setReportPage] = useState(0)

  return (
    <>
      {/* Feature 2: Data Visualizations - Redesigned as 3 parts */}
      <section 
        ref={visualizationsRef}
        className={`py-24 bg-white transition-all duration-1000 ease-in-out ${
          visualizationsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="container mx-auto px-6">
          {/* Part 1: Data Collection - REVISED based on image */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-stretch mb-48 border border-black rounded-xl shadow-lg p-6 min-h-[700px]">
            {/* Text Column (Left on lg screens, or top on mobile) */}
            <div className="order-2 lg:order-1 lg:col-span-2 flex flex-col">
              <div> {/* Wrapper for top content */}
                <h2 className="text-5xl font-bold text-black mb-6">Comprehensive Alumni Data</h2>
              </div>
              <p className="text-xl text-gray-700 mt-auto">
                Alumlo gathers all publicly available data on your alumni - no more losing track of the people that represent your organization.
              </p>
            </div>
            
            {/* Visual Column (Right on lg screens, or bottom on mobile) */}
            <div className="order-1 lg:order-2 lg:col-span-3 h-full">
              {/* Outer blurred container (mimics the large yellowish blurred rectangle) */}
              <div className="bg-black/5 backdrop-blur-lg rounded-2xl p-3 shadow-xl h-full">
                {/* Inner container and its content previously here are now removed */}
              </div>
            </div>
          </div>
          
          {/* Part 2: Visualizations */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-stretch mb-48 border border-black rounded-xl shadow-lg p-6 min-h-[700px]">
            {/* Text Column (Right on lg screens) */}
            <div className="order-1 lg:order-2 lg:col-span-2 flex flex-col">
              <div> {/* Wrapper for top content */}
                <h2 className="text-5xl font-bold text-black mb-4">Search your alumni</h2>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <div className="bg-emerald-100 rounded-full p-1 mr-3 mt-1">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    </div>
                    <span>Interactive charts that respond to your queries</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-emerald-100 rounded-full p-1 mr-3 mt-1">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    </div>
                    <span>Real-time data updates reflected instantly</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-emerald-100 rounded-full p-1 mr-3 mt-1">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    </div>
                    <span>Customizable views created upon request</span>
                  </li>
                </ul>
              </div>
              <p className="text-lg text-gray-700 mt-auto">
                Turn complex alumni data into beautiful, interactive visualizations that reveal patterns and trends at a glance.
              </p>
            </div>
            
            {/* Visualization Demo with Static Image (Left on lg screens) */}
            <div className="order-2 lg:order-1 lg:col-span-3">
              <img 
                src="/try.png" 
                alt="Data visualization dashboard" 
                className="w-full h-auto max-h-[1200px] shadow-lg rounded-lg border border-black"
              />
            </div>
          </div>
          
          {/* Part 3: AI Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-stretch mb-48 border border-black rounded-xl shadow-lg p-6 min-h-[700px]">
            {/* Text Column (Left on lg screens) */}
            <div className="order-2 lg:order-1 lg:col-span-2 flex flex-col">
              <div> {/* Wrapper for top content */}
                <h2 className="text-5xl font-bold text-black mb-4">We Deliver the Insights</h2>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <div className="bg-emerald-100 rounded-full p-1 mr-3 mt-1">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    </div>
                    <span>AI-powered analysis explains what the data means for your specific institution</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-emerald-100 rounded-full p-1 mr-3 mt-1">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    </div>
                    <span>Natural language interface for asking questions</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-emerald-100 rounded-full p-1 mr-3 mt-1">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    </div>
                    <span>School-specific insights and recommendations</span>
                  </li>
                </ul>
              </div>
              <p className="text-lg text-gray-700 mt-auto">
                Our AI analyzes the data to uncover meaningful insights, answering your questions and highlighting trends you might miss.
              </p>
            </div>
            
            {/* AI Insights Image (Right on lg screens) */}
            <div className="order-1 lg:order-2 lg:col-span-3">
              <img 
                src="/assets/3.png" 
                alt="AI insights dashboard" 
                className="w-full h-auto max-h-[1200px] shadow-lg rounded-lg border border-black"
              />
            </div>
          </div>
          
          {/* Added padding at the end of the section */}
          <div className="pb-20"></div>
        </div>
      </section>

      {/* New Section: We handle the hard data work */}
      <section 
        ref={reportsRef}
        className={`py-32 bg-white transition-all duration-1000 ease-in-out ${
          reportsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="container mx-auto px-6 text-center">
          {/* AlumIntel Logo */}
          <div className="flex justify-center mb-10">
            <Image 
              src="/assets/icons8-atom-48.png"
              alt="AlumIntel Logo"
              width={72} 
              height={72}
            />
          </div>
          
          {/* Headline */}
          <h2 className="text-5xl md:text-6xl font-bold text-black mb-12 max-w-4xl mx-auto leading-tight">
            We handle the hard data work <br /> so you can focus on your business.
          </h2>

          {/* Get a demo button */}
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: '#047857' }}
            whileTap={{ scale: 0.95 }}
            className="bg-emerald-600 text-white px-10 py-4 text-xl rounded-full hover:bg-emerald-700 transition-colors duration-300 font-semibold shadow-lg"
          >
            Get a demo
          </motion.button>
        </div>
      </section>
    </>
  )
}