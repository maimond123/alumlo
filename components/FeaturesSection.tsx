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
          {/* Part 1: Data Collection - Text first, then border, then image */}
          <div className="grid grid-cols-1 lg:grid-cols-13 gap-2 items-stretch mb-48 border border-gray-300 rounded-xl shadow-lg p-6 min-h-[700px]">
            {/* Text Column (Left on lg screens, top on mobile) */}
            <div className="order-1 lg:order-1 lg:col-span-4 flex flex-col">
              <div> {/* Wrapper for top content */}
                <h2 className="text-5xl font-bold text-black mb-6">Comprehensive Alumni Data, all in one place</h2>
              </div>
              <p className="text-2xl text-gray-700 mt-auto">
                Alumlo gathers publicly available data on your alumni - no more losing track of the people that represent your organization.
              </p>
            </div>
            
            {/* Vertical Divider - Hidden on mobile, visible on lg+ */}
            <div className="hidden lg:flex lg:col-span-1 items-center justify-center order-2">
              <div className="h-full w-px bg-gray-300"></div>
            </div>
            
            {/* Visual Column (Right on lg screens, bottom on mobile) */}
            <div className="order-3 lg:order-3 lg:col-span-8 h-full">
              {/* Outer container with exact beige/yellow background from reference */}
              <div className="bg-gradient-to-br from-yellow-200/40 to-orange-200/40 backdrop-blur-lg rounded-2xl p-8 shadow-xl h-full flex items-center justify-center">
                
                {/* Inner transparent container - more defined like in second image */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50 w-full max-w-2xl">
                  
                  {/* Profile Section - Top */}
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 mb-6 border-2 border-dashed border-gray-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <img 
                          src="https://media.licdn.com/dms/image/v2/D4E03AQH3Y3XkSH_Lpw/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1723857605737?e=1754524800&v=beta&t=rv-Xp7KZMF6xBI_MVnZ9O0DjXKojE7W8ZnSw5pkr84M"
                          alt="David Maimon"
                          className="w-16 h-16 rounded-full object-cover"
                        />
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">David Maimon</h3>
                          <p className="text-gray-600">Builder</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Profile Similarity</span>
                        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-semibold">80%</span>
                      </div>
                    </div>
                  </div>

                  {/* Processing Steps - More compact */}
                  <div className="space-y-3">
                    <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-gray-200 flex items-center justify-between">
                      <span className="text-gray-600 font-medium text-sm">Work Experience</span>
                      <Check className="w-4 h-4 text-emerald-500" />
                    </div>
                    
                    <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-gray-200 flex items-center justify-between">
                      <span className="text-gray-600 font-medium text-sm">Education History</span>
                      <Check className="w-4 h-4 text-emerald-500" />
                    </div>
                    
                    <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-gray-200 flex items-center justify-between">
                      <span className="text-gray-600 font-medium text-sm">Location</span>
                      <Check className="w-4 h-4 text-emerald-500" />
                    </div>
                    
                    <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-gray-200 flex items-center justify-between">
                      <span className="text-gray-600 font-medium text-sm">Professional Skills</span>
                      <Check className="w-4 h-4 text-emerald-500" />
                    </div>
                    
                    <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-gray-200 flex items-center justify-between">
                      <span className="text-gray-600 font-medium text-sm">Salary</span>
                      <Check className="w-4 h-4 text-emerald-500" />
                    </div>
                    
                    <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-gray-200 flex items-center justify-between">
                      <span className="text-gray-600 font-medium text-sm">LinkedIn Profile</span>
                      <Check className="w-4 h-4 text-emerald-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Part 2: Visualizations - Image first, then border, then text */}
          <div className="grid grid-cols-1 lg:grid-cols-13 gap-2 items-stretch mb-48 border border-gray-300 rounded-xl shadow-lg p-6 min-h-[700px]">
            {/* Visualization Demo with Search Interface (Left on lg screens) */}
            <div className="order-1 lg:order-1 lg:col-span-8">
              {/* Search Interface Container - matching first reference image */}
              <div className="relative bg-gradient-to-b from-emerald-500 via-emerald-400 via-emerald-300 to-white rounded-2xl p-8 shadow-lg border border-gray-200 h-full flex flex-col justify-start overflow-hidden">
                
                {/* Waterfall glow effect from search bar center flowing to bottom */}
                <div className="absolute inset-0 w-full h-full">
                  <div className="absolute inset-0 bg-gradient-radial from-emerald-300/80 via-emerald-400/50 to-emerald-500/30 rounded-2xl"></div>
                  <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/60 via-emerald-400/50 via-emerald-300/60 to-white/60 rounded-2xl"></div>
                </div>

                {/* Main Search Bar with enhanced glow - moved up */}
                <div className="relative bg-white rounded-full px-6 py-4 shadow-2xl border-2 border-gray-300 mb-8 flex items-center justify-between z-10 mt-8">
                  {/* Search bar glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-300/60 via-white to-emerald-300/60 rounded-full blur-sm -z-10"></div>
                  <div className="absolute inset-0 shadow-[0_0_40px_rgba(5,150,105,0.4)] rounded-full -z-10"></div>
                  
                  <span className="text-gray-400 text-lg">Search for people who...</span>
                  <div className="bg-gray-100 rounded-full p-2">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                    </svg>
                  </div>
                </div>

                {/* Three Search Options */}
                <div className="flex flex-wrap gap-4 justify-center relative z-10">
                  <div className="bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-md border border-gray-200">
                    <span className="text-gray-700 font-medium">Global People Search</span>
                  </div>
                  
                  <div className="bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-md border border-gray-200">
                    <span className="text-gray-700 font-medium">Alumni Discovery</span>
                  </div>
                  
                  <div className="bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-md border border-gray-200">
                    <span className="text-gray-700 font-medium">Deep People Research</span>
                  </div>
                </div>

                {/* Additional waterfall effect overlay - flowing to bottom edge */}
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/50 via-emerald-400/35 via-emerald-300/30 to-white/20 rounded-2xl pointer-events-none"></div>
              </div>
            </div>
            
            {/* Vertical Divider - Hidden on mobile, visible on lg+ */}
            <div className="hidden lg:flex lg:col-span-1 items-center justify-center order-2">
              <div className="h-full w-px bg-gray-300"></div>
            </div>
            
            {/* Text Column (Right on lg screens) */}
            <div className="order-3 lg:order-3 lg:col-span-4 flex flex-col">
              <div> {/* Wrapper for top content */}
                <h2 className="text-5xl font-bold text-black mb-4">Find your Alumni with natural language</h2>
              </div>
              <p className="text-2xl text-gray-700 mt-auto">
                Use alumni search to find unique marketable stories that showcase your organization's impact. No more relying on self-reported data, and complex filters for alumni outreach.
              </p>
            </div>
          </div>
          
          {/* Part 3: AI Insights - Text first, then border, then image */}
          <div className="grid grid-cols-1 lg:grid-cols-13 gap-2 items-stretch mb-48 border border-gray-300 rounded-xl shadow-lg p-6 min-h-[700px]">
            {/* Text Column (Left on lg screens) */}
            <div className="order-1 lg:order-1 lg:col-span-4 flex flex-col">
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
              <p className="text-2xl text-gray-700 mt-auto">
                Our AI analyzes the data to uncover meaningful insights, answering your questions and highlighting trends you might miss.
              </p>
            </div>
            
            {/* Vertical Divider - Hidden on mobile, visible on lg+ */}
            <div className="hidden lg:flex lg:col-span-1 items-center justify-center order-2">
              <div className="h-full w-px bg-gray-300"></div>
            </div>
            
            {/* AI Insights Image (Right on lg screens) */}
            <div className="order-3 lg:order-3 lg:col-span-8">
              <img 
                src="/assets/3.png" 
                alt="AI insights dashboard" 
                className="w-full h-auto max-h-[1200px] shadow-lg rounded-lg border border-gray-300"
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
          <div className="grid grid-cols-1 lg:grid-cols-13 gap-2 items-stretch mb-48 border border-black rounded-xl shadow-lg p-6 min-h-[700px]">
            {/* Visual Column (Left on lg screens) */}
            <div className="order-1 lg:order-1 lg:col-span-8">
              <img 
                src="/try.png" // Using existing image as a placeholder
                alt="Placeholder visual for new section" 
                className="w-full h-auto max-h-[1200px] shadow-lg rounded-lg border border-black"
              />
            </div>
            
            {/* Vertical Divider - Hidden on mobile, visible on lg+ */}
            <div className="hidden lg:flex lg:col-span-1 items-center justify-center order-2">
              <div className="h-full w-px bg-black"></div>
            </div>
            
            {/* Text Column (Right on lg screens) */}
            <div className="order-3 lg:order-3 lg:col-span-4 flex flex-col">
              <div> {/* Wrapper for top content */}
                <h2 className="text-5xl font-bold text-black mb-4">Placeholder New Section Title</h2>
              </div>
              <p className="text-2xl text-gray-700 mt-auto">
                Placeholder description for this new feature. Please replace this with the actual content.
              </p>
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