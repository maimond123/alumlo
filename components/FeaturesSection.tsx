'use client'

import { useRef, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useInView } from 'react-intersection-observer'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, FileText, ArrowRight, ChevronLeft, ChevronRight, Search, Check, UserCircle } from 'lucide-react'
import Image from 'next/image'
import { supabase } from '../app/data/supabase'

export default function FeaturesSection() {
  const router = useRouter()
  
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

  // Demo access loading state
  const [isLoading, setIsLoading] = useState(false)

  const handleDemoAccess = async () => {
    setIsLoading(true)
    
    try {
      // Sign in as the demo account
      const { data, error } = await supabase.auth.signInWithPassword({
        email: "maimondavid553@gmail.com",
        password: "Tryme12!" // Replace with your actual demo password
      });
      
      if (error) throw error;
      
      // Redirect to dashboard after successful login
      router.push('/dashboard')
    } catch (err) {
      console.error('Demo login error:', err)
      
      // Fallback - if login fails, still redirect to dashboard
      // The dashboard has logic to detect demo mode
      router.push('/dashboard')
    } finally {
      setIsLoading(false)
    }
  }

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
                <h2 className="text-5xl font-bold text-black mb-6">Comprehensive Alumni Data, all in one place</h2>
              </div>
              <p className="text-xl text-gray-700 mt-auto">
                Alumlo gathers publicly available data on your alumni - no more losing track of the people that represent your organization.
              </p>
            </div>
            
            {/* Visual Column (Right on lg screens, or bottom on mobile) */}
            <div className="order-1 lg:order-2 lg:col-span-3 h-full">
              {/* Outer blurred container (mimics the large yellowish blurred rectangle) */}
              <div className="bg-black/5 backdrop-blur-lg rounded-2xl p-8 shadow-xl h-full flex flex-col">
                {/* Profile Section at the top */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 mb-8 shadow-lg border border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <UserCircle className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">Sarah Chen</h3>
                      <p className="text-gray-600">Product Builder</p>
                    </div>
                  </div>
                </div>

                {/* Metadata Checklist */}
                <div className="space-y-4 flex-1">
                  <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-gray-200 flex items-center justify-between">
                    <span className="text-gray-800 font-medium">Location</span>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  
                  <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-gray-200 flex items-center justify-between">
                    <span className="text-gray-800 font-medium">Job History</span>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  
                  <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-gray-200 flex items-center justify-between">
                    <span className="text-gray-800 font-medium">Education History</span>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  
                  <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-gray-200 flex items-center justify-between">
                    <span className="text-gray-800 font-medium">Professional Skills</span>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  
                  <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-gray-200 flex items-center justify-between">
                    <span className="text-gray-800 font-medium">Industry Experience</span>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  
                  <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-gray-200 flex items-center justify-between">
                    <span className="text-gray-800 font-medium">Network Connections</span>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Part 2: Visualizations */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-stretch mb-48 border border-black rounded-xl shadow-lg p-6 min-h-[700px]">
            {/* Text Column (Right on lg screens) */}
            <div className="order-1 lg:order-2 lg:col-span-2 flex flex-col">
              <div> {/* Wrapper for top content */}
                <h2 className="text-5xl font-bold text-black mb-4">Find your alumni, with natural language</h2>
              </div>
              <p className="text-lg text-gray-700 mt-auto">
                Use alumni search to find unique marketable stories that showcase your organization's impact. No more relying on self-reported data, and complex filters for alumni outreach.
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
                <h2 className="text-5xl font-bold text-black mb-4">Discover deep alumni insights to solve business problems and market your organization </h2>
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

      {/* Section 5: New Feature Section (Formatted like Section 2) - MOVED UP & SPACING ADJUSTED */}
      <section 
        className="pb-24 bg-white opacity-100 translate-y-0" // Removed top padding, kept bottom
      >
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-stretch mb-48 border border-black rounded-xl shadow-lg p-6 min-h-[700px]">
            {/* Text Column (Right on lg screens) */}
            <div className="order-1 lg:order-2 lg:col-span-2 flex flex-col">
              <div> {/* Wrapper for top content */}
                <h2 className="text-5xl font-bold text-black mb-4">Placeholder New Section Title</h2>
              </div>
              <p className="text-lg text-gray-700 mt-auto">
                Placeholder description for this new feature. Please replace this with the actual content.
              </p>
            </div>
            
            {/* Visual Column (Left on lg screens) */}
            <div className="order-2 lg:order-1 lg:col-span-3">
              <img 
                src="/try.png" // Using existing image as a placeholder
                alt="Placeholder visual for new section" 
                className="w-full h-auto max-h-[1200px] shadow-lg rounded-lg border border-black"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: "We handle the hard data work..." - NOW LAST & SPACING ADJUSTED */}
      <section 
        ref={reportsRef} // reportsRef might need to be re-evaluated if it was for the original last section
        className={`pb-32 bg-white transition-all duration-1000 ease-in-out ${ // Removed top padding, kept bottom
          reportsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10' // Animation trigger might need adjustment
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
            onClick={handleDemoAccess}
            disabled={isLoading}
            whileHover={{ scale: 1.05, backgroundColor: '#047857' }}
            whileTap={{ scale: 0.95 }}
            className="bg-emerald-600 text-white px-10 py-4 text-xl rounded-full hover:bg-emerald-700 transition-colors duration-300 font-semibold shadow-lg"
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Loading...
              </>
            ) : (
              "Try Demo"
            )}
          </motion.button>
          {/* Added spacing at the bottom of this now last section */}
          <div className="pb-48"></div> 
        </div>
      </section>
    </>
  )
}