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
      const timeout = setTimeout(() => {
        setTypedText(fullText.slice(0, typedText.length + 1))
      }, 50)
      
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
              <h3 className="text-xl font-semibold mb-2">Natural Language</h3>
              <p>Ask questions in plain English, just like you would to a colleague.</p>
            </div>
            
            <div className="bg-emerald-50 p-6 rounded-lg">
              <div className="bg-emerald-100 rounded-full p-3 w-14 h-14 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Instant Results</h3>
              <p>Get answers in milliseconds, not minutes. No more wasted time.</p>
            </div>
            
            <div className="bg-emerald-50 p-6 rounded-lg">
              <div className="bg-emerald-100 rounded-full p-3 w-14 h-14 flex items-center justify-center mb-4">
                <Link className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Direct Connection</h3>
              <p>Connect with alumni on LinkedIn with just one click.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 2: Visualizations */}
      <section 
        ref={visualizationsRef}
        className={`py-24 bg-emerald-50 transition-all duration-1000 ease-in-out border-t border-b border-black ${
          visualizationsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Interactive Visualization Demo */}
            <div className="bg-white rounded-xl p-8 shadow-lg order-2 lg:order-1">
              <h3 className="text-xl font-semibold mb-4 text-emerald-800">Interactive Charts</h3>
              
              <div className="flex space-x-2 mb-4">
                <button 
                  onClick={() => setActiveChart(0)}
                  className={`px-3 py-1 rounded-full text-sm ${activeChart === 0 ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800'}`}
                >
                  Industries
                </button>
                <button 
                  onClick={() => setActiveChart(1)}
                  className={`px-3 py-1 rounded-full text-sm ${activeChart === 1 ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800'}`}
                >
                  Locations
                </button>
                <button 
                  onClick={() => setActiveChart(2)}
                  className={`px-3 py-1 rounded-full text-sm ${activeChart === 2 ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800'}`}
                >
                  Salaries
                </button>
              </div>
              
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4 min-h-[250px] flex items-center justify-center">
                {activeChart === 0 && (
                  <div className="w-full h-full flex flex-col">
                    <div className="text-center mb-2 text-sm text-emerald-800 font-medium">Top Industries</div>
                    <div className="flex-1 flex items-end space-x-2">
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
                )}
                
                {activeChart === 1 && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="relative w-48 h-48">
                      <div className="absolute inset-0 rounded-full border-4 border-emerald-200"></div>
                      <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent" style={{transform: 'rotate(45deg)'}}></div>
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <div className="text-3xl font-bold text-emerald-700">42%</div>
                        <div className="text-sm text-emerald-600">San Francisco</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeChart === 2 && (
                  <div className="w-full h-full">
                    <div className="text-center mb-2 text-sm text-emerald-800 font-medium">Salary Growth</div>
                    <svg viewBox="0 0 100 50" className="w-full h-40">
                      <path d="M0,50 L10,45 L20,40 L30,38 L40,30 L50,25 L60,20 L70,15 L80,10 L90,8 L100,5" 
                        fill="none" 
                        stroke="#059669" 
                        strokeWidth="2" 
                      />
                      <path d="M0,50 L10,45 L20,40 L30,38 L40,30 L50,25 L60,20 L70,15 L80,10 L90,8 L100,5" 
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
                    <div className="flex justify-between text-xs text-gray-600">
                      <div>0 Years</div>
                      <div>5 Years</div>
                      <div>10 Years</div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <div className="text-sm font-medium text-emerald-800">AI Insight:</div>
                <div className="text-sm text-emerald-700">
                  {activeChart === 0 && "Tech industry employment has grown 23% in the last 2 years among your alumni."}
                  {activeChart === 1 && "42% of your alumni work in the San Francisco Bay Area, a 15% increase since 2020."}
                  {activeChart === 2 && "Alumni salaries increase by an average of 12% per year in the first 5 years after graduation."}
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
              <div className="p-3 rounded-full w-20 h-20 flex items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100 mb-6">
                <BarChart className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-3xl font-bold text-emerald-800 mb-4">AI-Powered Data Visualizations</h2>
              <p className="text-lg text-emerald-700 mb-6">Explore interactive charts with AI-generated insights that explain trends and patterns in your alumni network. Uncover hidden connections and opportunities that traditional analytics might miss.</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <div className="bg-emerald-100 rounded-full p-1 mr-3 mt-1">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  </div>
                  <span>Interactive charts update in real-time</span>
                </li>
                <li className="flex items-start">
                  <div className="bg-emerald-100 rounded-full p-1 mr-3 mt-1">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  </div>
                  <span>AI-generated insights explain what the data means</span>
                </li>
                <li className="flex items-start">
                  <div className="bg-emerald-100 rounded-full p-1 mr-3 mt-1">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  </div>
                  <span>Customize visualizations for your specific needs</span>
                </li>
              </ul>
              <button className="flex items-center text-emerald-600 font-semibold hover:text-emerald-800 transition-colors">
                Learn more <ArrowRight className="ml-2 w-5 h-5" />
              </button>
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