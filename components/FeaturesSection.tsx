'use client'

import { useRef, useEffect, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, BarChart, FileText, ArrowRight, ChevronLeft, ChevronRight, Zap, Link } from 'lucide-react'
import AlumniSearchDemo from './AlumniSearchDemo'

export default function FeaturesSection() {
  // Create separate refs for each section
  const { ref: searchRef, inView: searchInView } = useInView({
    threshold: 0.1,
    triggerOnce: true
  })
  
  const { ref: visualizationsRef, inView: visualizationsInView } = useInView({
    threshold: 0.1,
    triggerOnce: true
  })
  
  const { ref: reportsRef, inView: reportsInView } = useInView({
    threshold: 0.1,
    triggerOnce: true
  })

  // Demo state for search feature
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  
  // Demo state for visualization feature
  const [activeChart, setActiveChart] = useState(0)
  
  // Demo state for reports feature
  const [reportPage, setReportPage] = useState(0)

  // Typewriter animation state
  const [typedText, setTypedText] = useState('')
  const [isTypingComplete, setIsTypingComplete] = useState(false)
  const fullText = "Search your alumni network using natural language. No complex filters needed."
  
  useEffect(() => {
    if (searchInView && typedText.length < fullText.length) {
      // Get the next character
      const nextChar = fullText[typedText.length]
      
      const timeout = setTimeout(() => {
        // Add the character to the typed text
        setTypedText(fullText.slice(0, typedText.length + 1))
      }, nextChar === '.' ? 250 : 40) // Speed up from 50ms to 25ms, pause 300ms after period
      
      return () => clearTimeout(timeout)
    } else if (typedText.length === fullText.length && !isTypingComplete) {
      setIsTypingComplete(true)
    }
  }, [searchInView, typedText, fullText, isTypingComplete])

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setIsSearching(true)
      setTimeout(() => setIsSearching(false), 1500)
    }
  }

  return (
    <>
      {/* Feature 1: Search */}
      <section 
        ref={searchRef}
        className="py-32 bg-white min-h-[800px] border-t border-b border-black">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-black mb-6">
              Alumni Access, Reimagined with Search
            </h2>
            <p className="text-xl md:text-2xl text-black max-w-3xl mx-auto h-16 flex items-center justify-center">
              {typedText}
              {!isTypingComplete && (
                <span className="ml-1 inline-block w-0.5 h-6 bg-emerald-700 animate-blink"></span>
              )}
            </p>
          </div>
        
          {/* Working Demo */}
          <AlumniSearchDemo />
          
          {/* Benefits Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24">
            <div className="bg-emerald-50 p-6 rounded-lg">
              <div className="bg-emerald-100 rounded-full p-3 w-14 h-14 flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Boost Engagement</h3>
              <p>Increase alumni participation by making it effortless to find relevant connections for mentorship and networking.</p>
            </div>
            
            <div className="bg-emerald-50 p-6 rounded-lg">
              <div className="bg-emerald-100 rounded-full p-3 w-14 h-14 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Improve Fundraising</h3>
              <p>Strengthen donor relationships by connecting alumni with shared interests and career paths.</p>
            </div>
            
            <div className="bg-emerald-50 p-6 rounded-lg">
              <div className="bg-emerald-100 rounded-full p-3 w-14 h-14 flex items-center justify-center mb-4">
                <Link className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Enhance Career Services</h3>
              <p>Provide students with valuable industry connections and mentorship opportunities to improve career outcomes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 2: Data Visualizations - Redesigned as 3 parts */}
      <section 
        ref={visualizationsRef}
        className={`py-24 bg-white transition-all duration-1000 ease-in-out border-t border-b border-black ${
          visualizationsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="container mx-auto px-6">
          {/* Part 1: Data Collection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-32">
            <div className="order-2 lg:order-1">
              <h2 className="text-6xl font-bold text-black mb-6">We Gather the Data</h2>
              <p className="text-xl text-gray-700 mb-8">
                Our platform automatically collects and organizes alumni information from public professional profiles, 
                creating a comprehensive database that's always up-to-date.
              </p>
              <ul className="space-y-4 mb-10 text-lg">
                <li className="flex items-start">
                  <div className="bg-emerald-100 rounded-full p-1 mr-3 mt-1.5">
                    <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                  </div>
                  <span>Automated collection from professional networks</span>
                </li>
                <li className="flex items-start">
                  <div className="bg-emerald-100 rounded-full p-1 mr-3 mt-1.5">
                    <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                  </div>
                  <span>Continuous updates to keep information current</span>
                </li>
                <li className="flex items-start">
                  <div className="bg-emerald-100 rounded-full p-1 mr-3 mt-1.5">
                    <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                  </div>
                  <span>Ethical data collection respecting privacy</span>
                </li>
              </ul>
            </div>
            
            {/* Data Collection Animation - Scrolling Data Table */}
            <div className="order-1 lg:order-2 bg-white rounded-xl p-8 shadow-lg w-full">
              <div className="relative h-96 overflow-hidden rounded-lg bg-white border border-black">
                {/* Data table with scrolling effect */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="animate-dataScroll" style={{ animationDuration: '30s' }}>
                    {/* Table header */}
                    <div className="sticky top-0 bg-emerald-100 border-b border-gray-300 px-4 py-3 grid grid-cols-5 gap-2 text-sm font-medium text-emerald-800">
                      <div>Name</div>
                      <div>Graduation</div>
                      <div>Company</div>
                      <div>Position</div>
                      <div>Location</div>
                    </div>
                    
                    {/* Table rows - will be scrolling */}
                    {[...Array(20)].map((_, i) => (
                      <div 
                        key={i}
                        className={`px-4 py-3 grid grid-cols-5 gap-2 text-sm border-b border-gray-200 ${
                          i % 7 === 3 ? 'bg-emerald-50' : 'bg-white'
                        } transition-colors duration-300 hover:bg-emerald-50`}
                      >
                        <div className="font-medium">Alumni {i + 1}</div>
                        <div>{2010 + (i % 12)}</div>
                        <div>{['Google', 'Microsoft', 'Amazon', 'Apple', 'Meta', 'Netflix', 'Tesla'][i % 7]}</div>
                        <div>{['Software Engineer', 'Product Manager', 'Data Scientist', 'UX Designer', 'Marketing Manager'][i % 5]}</div>
                        <div>{['San Francisco', 'New York', 'Seattle', 'Boston', 'Austin', 'Chicago'][i % 6]}</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Profile highlights that appear periodically */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Profile 1 */}
                  <div className="absolute inset-0 bg-white/90 flex items-center justify-center opacity-0 animate-profileAppear" style={{ animationDelay: '3s' }}>
                    <div className="bg-white rounded-xl shadow-lg p-6 max-w-md flex items-start space-x-4 border border-emerald-200">
                      <div className="w-20 h-20 rounded-full bg-emerald-100 overflow-hidden flex-shrink-0">
                        <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold">
                          JD
                        </div>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-emerald-800">Jane Doe</h3>
                        <p className="text-emerald-600 mb-2">Class of 2015</p>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span>Senior Product Manager at Google</span>
                          </div>
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>San Francisco, CA</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Profile 2 */}
                  <div className="absolute inset-0 bg-white/90 flex items-center justify-center opacity-0 animate-profileAppear" style={{ animationDelay: '10s' }}>
                    <div className="bg-white rounded-xl shadow-lg p-6 max-w-md flex items-start space-x-4 border border-emerald-200">
                      <div className="w-20 h-20 rounded-full bg-emerald-100 overflow-hidden flex-shrink-0">
                        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                          MS
                        </div>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-emerald-800">Michael Smith</h3>
                        <p className="text-emerald-600 mb-2">Class of 2018</p>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span>Software Engineer at Microsoft</span>
                          </div>
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>Seattle, WA</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Profile 3 */}
                  <div className="absolute inset-0 bg-white/90 flex items-center justify-center opacity-0 animate-profileAppear" style={{ animationDelay: '17s' }}>
                    <div className="bg-white rounded-xl shadow-lg p-6 max-w-md flex items-start space-x-4 border border-emerald-200">
                      <div className="w-20 h-20 rounded-full bg-emerald-100 overflow-hidden flex-shrink-0">
                        <div className="w-full h-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                          AJ
                        </div>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-emerald-800">Aisha Johnson</h3>
                        <p className="text-emerald-600 mb-2">Class of 2020</p>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span>Data Scientist at Amazon</span>
                          </div>
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>New York, NY</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Platform logos - smaller and positioned at the top */}
                  <div className="absolute top-2 right-2 flex space-x-2">
                    <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center shadow-sm">
                      <img 
                        src="/assets/linkedin.png" 
                        alt="LinkedIn" 
                        className="w-6 h-6 object-contain"
                      />
                    </div>
                    <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center shadow-sm">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">f</div>
                    </div>
                    <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center shadow-sm">
                      <img 
                        src="/assets/glassdoor.svg" 
                        alt="Glassdoor" 
                        className="w-6 h-6 object-contain"
                      />
                    </div>
                  </div>
                </div>
                
                <style jsx>{`
                  @keyframes dataScroll {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(-50%); }
                  }
                  
                  @keyframes profileAppear {
                    0%, 100% { opacity: 0; }
                    3%, 13% { opacity: 1; }
                  }
                  
                  .animate-dataScroll {
                    animation: dataScroll 30s linear infinite;
                  }
                  
                  .animate-profileAppear {
                    animation: profileAppear 30s linear infinite;
                  }
                `}</style>
              </div>
            </div>
          </div>
          
          {/* Part 2: Visualizations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-32">
            <div className="order-1 lg:order-2">
              <h2 className="text-5xl font-bold text-black mb-4">We Transform It Visually</h2>
              <p className="text-lg text-gray-700 mb-6">
                Turn complex alumni data into beautiful, interactive visualizations that reveal patterns and trends at a glance.
              </p>
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
                  <span>Customizable views for different stakeholders</span>
                </li>
              </ul>
            </div>
            
            {/* Visualization Demo - Placeholder for screen recording */}
            <div className="order-2 lg:order-1 bg-white rounded-xl p-4 shadow-lg">
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-emerald-200">
                {/* This would be replaced with your actual video or interactive demo */}
                <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-emerald-100 p-4">
                  <div className="bg-white rounded-lg p-3 mb-4 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <div className="font-medium text-emerald-800">Alumni Industry Distribution</div>
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <div className="w-2 h-2 rounded-full bg-emerald-300"></div>
                        <div className="w-2 h-2 rounded-full bg-emerald-100"></div>
                      </div>
                    </div>
                    <div className="flex items-end space-x-2 h-32">
                      <div className="flex-1 flex flex-col items-center">
                        <div className="w-full bg-emerald-500 rounded-t-sm" style={{height: '85%'}}></div>
                        <div className="text-xs mt-1">Tech</div>
                      </div>
                      <div className="flex-1 flex flex-col items-center">
                        <div className="w-full bg-emerald-500 rounded-t-sm" style={{height: '65%'}}></div>
                        <div className="text-xs mt-1">Finance</div>
                      </div>
                      <div className="flex-1 flex flex-col items-center">
                        <div className="w-full bg-emerald-500 rounded-t-sm" style={{height: '45%'}}></div>
                        <div className="text-xs mt-1">Health</div>
                      </div>
                      <div className="flex-1 flex flex-col items-center">
                        <div className="w-full bg-emerald-500 rounded-t-sm" style={{height: '35%'}}></div>
                        <div className="text-xs mt-1">Education</div>
                      </div>
                      <div className="flex-1 flex flex-col items-center">
                        <div className="w-full bg-emerald-500 rounded-t-sm" style={{height: '25%'}}></div>
                        <div className="text-xs mt-1">Retail</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <div className="text-sm font-medium text-emerald-800 mb-2">Geographic Distribution</div>
                      <div className="relative w-full h-24">
                        <div className="absolute inset-0 rounded-full border-4 border-emerald-200"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent" style={{transform: 'rotate(45deg)'}}></div>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                          <div className="text-lg font-bold text-emerald-700">42%</div>
                          <div className="text-xs text-emerald-600">SF Bay</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <div className="text-sm font-medium text-emerald-800 mb-2">Salary Growth</div>
                      <svg viewBox="0 0 100 50" className="w-full h-24">
                        <path d="M0,50 L10,45 L20,40 L30,38 L40,30 L50,25 L60,20 L70,15 L80,10 L90,8 L100,5" 
                          fill="none" 
                          stroke="#059669" 
                          strokeWidth="2" 
                        />
                        <path d="M0,50 L10,45 L20,40 L30,38 L40,30 L50,25 L60,20 L70,15 L80,10 L90,8 L100,5 L100,50 L0,50" 
                          fill="url(#gradient)" 
                          fillOpacity="0.2" 
                          stroke="none" 
                        />
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#059669" stopOpacity="0.8"/>
                            <stop offset="100%" stopColor="#059669" stopOpacity="0"/>
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Part 3: AI Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <h2 className="text-5xl font-bold text-black mb-4">We Deliver the Insights</h2>
              <p className="text-lg text-gray-700 mb-6">
                Our AI analyzes the data to uncover meaningful insights, answering your questions and highlighting trends you might miss.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <div className="bg-emerald-100 rounded-full p-1 mr-3 mt-1">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  </div>
                  <span>AI-powered analysis explains what the data means</span>
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
                  <span>Proactive insights that highlight opportunities</span>
                </li>
              </ul>
            </div>
            
            {/* AI Insights Chatbot Demo - Placeholder for screen recording */}
            <div className="order-1 lg:order-2 bg-white rounded-xl p-4 shadow-lg">
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-emerald-200">
                {/* This would be replaced with your actual video of chatbot functionality */}
                <div className="w-full h-full bg-white p-4 flex flex-col">
                  <div className="bg-emerald-50 rounded-lg p-3 mb-3 max-w-[80%]">
                    <p className="text-sm text-emerald-800">What trends do you see in alumni career paths?</p>
                  </div>
                  
                  <div className="bg-emerald-100 rounded-lg p-3 mb-3 max-w-[80%] ml-auto">
                    <p className="text-sm text-emerald-800">Based on the data, I'm seeing three key trends:</p>
                    <ol className="text-sm text-emerald-700 mt-2 pl-5 list-decimal">
                      <li>42% of alumni transition to management roles within 5 years</li>
                      <li>Tech industry employment has grown 23% in the last 2 years</li>
                      <li>Alumni who work abroad for 2+ years see 35% higher salary growth</li>
                    </ol>
                  </div>
                  
                  <div className="bg-emerald-50 rounded-lg p-3 mb-3 max-w-[80%]">
                    <p className="text-sm text-emerald-800">Which companies are hiring the most alumni?</p>
                  </div>
                  
                  <div className="bg-emerald-100 rounded-lg p-3 max-w-[80%] ml-auto">
                    <p className="text-sm text-emerald-800">The top hiring companies for your alumni are:</p>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-emerald-600 h-2.5 rounded-full" style={{width: '85%'}}></div>
                        </div>
                        <span className="ml-2 text-xs">Google (42)</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-emerald-600 h-2.5 rounded-full" style={{width: '70%'}}></div>
                        </div>
                        <span className="ml-2 text-xs">Microsoft (38)</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-emerald-600 h-2.5 rounded-full" style={{width: '60%'}}></div>
                        </div>
                        <span className="ml-2 text-xs">Amazon (29)</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Typing indicator */}
                  <div className="mt-auto">
                    <div className="border-t border-gray-200 pt-3">
                      <div className="bg-gray-100 rounded-full px-4 py-2 flex items-center">
                        <input type="text" placeholder="Ask about your alumni data..." className="bg-transparent border-none w-full focus:outline-none text-sm" />
                        <button className="ml-2 p-1 rounded-full bg-emerald-500 text-white">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 3: Reports */}
      <section 
        ref={reportsRef}
        className={`py-24 bg-white transition-all duration-1000 ease-in-out border-t border-b border-black ${
          reportsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="p-3 rounded-full w-20 h-20 flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 mb-6">
                <FileText className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-3xl font-bold text-emerald-800 mb-4">Beautiful Downloadable Reports</h2>
              <p className="text-lg text-emerald-700 mb-6">Generate professional reports with just a few clicks to share with stakeholders or use in marketing materials. Customize layouts, colors, and content to match your institution's branding.</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <div className="bg-blue-100 rounded-full p-1 mr-3 mt-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  </div>
                  <span>Export in PDF, PowerPoint, or Excel formats</span>
                </li>
                <li className="flex items-start">
                  <div className="bg-blue-100 rounded-full p-1 mr-3 mt-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  </div>
                  <span>Customize with your school's branding</span>
                </li>
                <li className="flex items-start">
                  <div className="bg-blue-100 rounded-full p-1 mr-3 mt-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  </div>
                  <span>Schedule automated reports for stakeholders</span>
                </li>
              </ul>
              <button className="flex items-center text-emerald-600 font-semibold hover:text-emerald-800 transition-colors">
                Learn more <ArrowRight className="ml-2 w-5 h-5" />
              </button>
            </div>
            
            {/* Interactive Report Demo */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-emerald-800">Preview Report</h3>
              
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-emerald-600 text-white p-4 flex justify-between items-center">
                  <div className="font-medium">Alumni Success Report</div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => setReportPage(0)}
                      className={`w-2 h-2 rounded-full ${reportPage === 0 ? 'bg-white' : 'bg-white/50'}`}
                    ></button>
                    <button 
                      onClick={() => setReportPage(1)}
                      className={`w-2 h-2 rounded-full ${reportPage === 1 ? 'bg-white' : 'bg-white/50'}`}
                    ></button>
                    <button 
                      onClick={() => setReportPage(2)}
                      className={`w-2 h-2 rounded-full ${reportPage === 2 ? 'bg-white' : 'bg-white/50'}`}
                    ></button>
                  </div>
                </div>
                
                <div className="p-6 min-h-[250px]">
                  {reportPage === 0 && (
                    <div className="space-y-4">
                      <div className="text-lg font-bold text-emerald-800">Executive Summary</div>
                      <div className="h-3 bg-gray-200 rounded-full w-full"></div>
                      <div className="h-3 bg-gray-200 rounded-full w-5/6"></div>
                      <div className="h-3 bg-gray-200 rounded-full w-full"></div>
                      <div className="h-3 bg-gray-200 rounded-full w-4/6"></div>
                      <div className="mt-6 flex justify-between">
                        <div className="text-center p-3 bg-emerald-50 rounded-lg w-[30%]">
                          <div className="text-2xl font-bold text-emerald-700">94%</div>
                          <div className="text-xs text-emerald-600">Employment Rate</div>
                        </div>
                        <div className="text-center p-3 bg-emerald-50 rounded-lg w-[30%]">
                          <div className="text-2xl font-bold text-emerald-700">$78K</div>
                          <div className="text-xs text-emerald-600">Avg. Starting Salary</div>
                        </div>
                        <div className="text-center p-3 bg-emerald-50 rounded-lg w-[30%]">
                          <div className="text-2xl font-bold text-emerald-700">68%</div>
                          <div className="text-xs text-emerald-600">In Target Industries</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {reportPage === 1 && (
                    <div className="space-y-4">
                      <div className="text-lg font-bold text-emerald-800">Industry Breakdown</div>
                      <div className="flex items-center justify-between py-2 border-b">
                        <span className="font-medium">Technology</span>
                        <div className="flex items-center">
                          <div className="w-32 h-4 bg-gray-200 rounded-full overflow-hidden mr-2">
                            <div className="h-full bg-emerald-500 rounded-full" style={{width: '42%'}}></div>
                          </div>
                          <span className="text-sm">42%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b">
                        <span className="font-medium">Finance</span>
                        <div className="flex items-center">
                          <div className="w-32 h-4 bg-gray-200 rounded-full overflow-hidden mr-2">
                            <div className="h-full bg-emerald-500 rounded-full" style={{width: '28%'}}></div>
                          </div>
                          <span className="text-sm">28%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b">
                        <span className="font-medium">Healthcare</span>
                        <div className="flex items-center">
                          <div className="w-32 h-4 bg-gray-200 rounded-full overflow-hidden mr-2">
                            <div className="h-full bg-emerald-500 rounded-full" style={{width: '15%'}}></div>
                          </div>
                          <span className="text-sm">15%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="font-medium">Other</span>
                        <div className="flex items-center">
                          <div className="w-32 h-4 bg-gray-200 rounded-full overflow-hidden mr-2">
                            <div className="h-full bg-emerald-500 rounded-full" style={{width: '15%'}}></div>
                          </div>
                          <span className="text-sm">15%</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {reportPage === 2 && (
                    <div className="space-y-4">
                      <div className="text-lg font-bold text-emerald-800">Top Employers</div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-500">1.</div>
                          <div className="font-medium">Google</div>
                          <div className="text-xs text-emerald-600">42 alumni</div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-500">2.</div>
                          <div className="font-medium">Microsoft</div>
                          <div className="text-xs text-emerald-600">38 alumni</div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-500">3.</div>
                          <div className="font-medium">Goldman Sachs</div>
                          <div className="text-xs text-emerald-600">29 alumni</div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-500">4.</div>
                          <div className="font-medium">Amazon</div>
                          <div className="text-xs text-emerald-600">27 alumni</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="bg-gray-50 p-4 flex justify-between items-center">
                  <button 
                    onClick={() => setReportPage(prev => Math.max(0, prev - 1))}
                    className="p-2 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50"
                    disabled={reportPage === 0}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="text-sm text-gray-500">
                    Page {reportPage + 1} of 3
                  </div>
                  <button 
                    onClick={() => setReportPage(prev => Math.min(2, prev + 1))}
                    className="p-2 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50"
                    disabled={reportPage === 2}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}