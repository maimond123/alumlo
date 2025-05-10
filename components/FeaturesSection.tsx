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
        className="py-32 bg-white min-h-[800px] border-t border-b border-black border-[0.5px]">
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
        className={`py-24 bg-white transition-all duration-1000 ease-in-out ${
          visualizationsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="container mx-auto px-6">
          {/* Part 1: Data Collection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-32">
            <div className="order-2 lg:order-1">
              <h2 className="text-5xl font-bold text-black mb-6">We Gather the Data</h2>
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
                  <span>Collect 30+ unique data points for each alumni profile</span>
                </li>
              </ul>
            </div>
            
            {/* Data Collection Animation - Improved */}
            <div className="order-1 lg:order-2 bg-white rounded-xl p-8 shadow-lg w-full">
              <div className="relative h-[450px] overflow-hidden rounded-lg bg-white border border-black">
                {/* Data table with scrolling effect */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="animate-dataScroll" style={{ animationDuration: '15s', animationPlayState: 'running' }}>
                    {/* Table header */}
                    <div className="sticky top-0 bg-emerald-100 border-b border-gray-300 px-4 py-3 grid grid-cols-5 gap-2 text-sm font-medium text-emerald-800">
                      <div>Name</div>
                      <div>Graduation</div>
                      <div>Company</div>
                      <div>Position</div>
                      <div>Location</div>
                    </div>
                    
                    {/* Table rows - will be scrolling */}
                    {[...Array(40)].map((_, i) => (
                      <div 
                        key={i}
                        className={`px-4 py-3 grid grid-cols-5 gap-2 text-sm border-b border-gray-200 ${
                          i % 7 === 3 ? 'bg-emerald-50' : 'bg-white'
                        } transition-colors duration-300 hover:bg-emerald-50`}
                      >
                        <div className="font-medium">Alumni {i + 1}</div>
                        <div>{2010 + (i % 12)}</div>
                        <div>{['Google', 'Microsoft', 'Amazon', 'Apple', 'Meta', 'Netflix', 'Tesla', 'Adobe', 'Salesforce', 'IBM'][i % 10]}</div>
                        <div>{['Software Engineer', 'Product Manager', 'Data Scientist', 'UX Designer', 'Marketing Manager', 'Financial Analyst', 'HR Specialist'][i % 7]}</div>
                        <div>{['San Francisco', 'New York', 'Seattle', 'Boston', 'Austin', 'Chicago', 'Los Angeles', 'Denver'][i % 8]}</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Profile highlights that appear periodically */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Profile 1 */}
                  <div className="absolute inset-0 bg-white/90 flex items-center justify-center opacity-0 animate-profile1">
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
                  <div className="absolute inset-0 bg-white/90 flex items-center justify-center opacity-0 animate-profile2">
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
                  <div className="absolute inset-0 bg-white/90 flex items-center justify-center opacity-0 animate-profile3">
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
                </div>
                
                <style jsx>{`
                  @keyframes dataScroll {
                    0%, 100% { transform: translateY(0); }
                    16.66%, 50%, 83.33% { transform: translateY(-50%); }
                    20%, 53.33%, 86.66% { transform: translateY(0); }
                  }
                  
                  @keyframes profile1 {
                    0%, 16.66%, 33.33%, 100% { opacity: 0; }
                    20%, 30% { opacity: 1; }
                  }
                  
                  @keyframes profile2 {
                    0%, 50%, 66.66%, 100% { opacity: 0; }
                    53.33%, 63.33% { opacity: 1; }
                  }
                  
                  @keyframes profile3 {
                    0%, 83.33%, 100% { opacity: 0; }
                    86.66%, 96.66% { opacity: 1; }
                  }
                  
                  .animate-dataScroll {
                    animation: dataScroll 15s linear infinite;
                  }
                  
                  .animate-profile1 {
                    animation: profile1 15s linear infinite;
                  }
                  
                  .animate-profile2 {
                    animation: profile2 15s linear infinite;
                  }
                  
                  .animate-profile3 {
                    animation: profile3 15s linear infinite;
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
                  <span>Customizable views created upon request</span>
                </li>
              </ul>
            </div>
            
            {/* Visualization Demo with Static Image */}
            <div className="order-2 lg:order-1">
              <img 
                src="/try.png" 
                alt="Data visualization dashboard" 
                className="w-full h-auto max-h-[1200px] shadow-lg rounded-lg border border-black"
              />
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
            
            {/* AI Insights Image */}
            <div className="order-1 lg:order-2">
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

      {/* Feature 3: Reports - Redesigned Layout */}
      <section 
        ref={reportsRef}
        className={`pt-12 pb-24 bg-white transition-all duration-1000 ease-in-out border-t border-b border-black border-[0.5px] ${
          reportsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="container mx-auto px-6">
          {/* Centered Catchphrase */}
          <div className="text-center mb-16 pt-10">
            <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">
              Customizable Comprehensive Reports
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              We transform your alumni data into compelling visual stories that drive action
            </p>
          </div>
          
          {/* Main Content - Image on Left, Description on Right */}
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Report Image - Takes up more space */}
            <div className="lg:w-7/12">
              <div className="h-[535px] overflow-hidden">
                <img 
                  src="/report_demo.png" 
                  alt="Alumni Success Report" 
                  className="rounded-xl shadow-xl border border-black w-full h-full object-cover"
                />
              </div>
            </div>
            
            {/* Description Content - Takes up less space */}
            <div className="lg:w-5/12">
              <h3 className="text-2xl font-bold text-black mb-4">Data-Driven Decision Making</h3>
              <p className="text-lg text-gray-700 mb-6">
                Receive professional customizable school reports based on our extracted data and insights. Generating your own report is currently in beta testing.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start">
                  <div className="bg-emerald-100 rounded-full p-2 mr-4 mt-1">
                    <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">School-Specific Analysis</h4>
                    <p className="text-gray-600">Comprehensive reports tailored to your institution's unique alumni ecosystem and challenges</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-emerald-100 rounded-full p-2 mr-4 mt-1">
                    <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Alumni Success Metrics</h4>
                    <p className="text-gray-600">Detailed insights into career trajectories, industry impact, and professional achievements</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-emerald-100 rounded-full p-2 mr-4 mt-1">
                    <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Custom Branding Options</h4>
                    <p className="text-gray-600">Reports can be styled with your institution's colors, logos, and visual identity</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Added padding at the end of the section - reduced further */}
          <div className="pb-20"></div>
        </div>
      </section>
    </>
  )
}