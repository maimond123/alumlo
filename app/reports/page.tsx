"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Download, Maximize2, X, ChevronLeft, ChevronRight, BarChart4, Search } from "lucide-react"
import Sidebar from "../../components/Sidebar"
import { useSidebar } from "../../components/SidebarProvider"
import * as htmlToImage from "html-to-image"
import { saveAs } from "file-saver"
import Image from "next/image"
import { PieChart, BarChart, SalaryBarChart, IndustryPieChart } from '../../components/chart'
import { supabase } from '../data/supabase'
import { useRouter } from 'next/navigation'
import { getUserEmail } from '../utils/auth'

export default function ReportsPage() {
  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar />
      <ReportsContent />
    </div>
  )
}

function ReportsContent() {
  const router = useRouter()
  const [schoolName, setSchoolName] = useState<string>('')
  const { isSidebarOpen } = useSidebar()
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [selectedYears, setSelectedYears] = useState<string[]>([])
  const [yearInput, setYearInput] = useState("")
  const [suggestedYears, setSuggestedYears] = useState<string[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [generatedReport, setGeneratedReport] = useState<any>(null)
  const [isDecadeView, setIsDecadeView] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)
  const [salaryData, setSalaryData] = useState<any>(null)
  const [industryData, setIndustryData] = useState<any>(null)
  const [locationData, setLocationData] = useState<Array<{ name: string; value: number }>>([])

  useEffect(() => {
    const fetchSchoolName = async () => {
      try {
        const userEmail = await getUserEmail()
        
        if (!userEmail) {
          console.error('No email found for user')
          throw new Error('No user email found')
        }
    
        const { data, error } = await supabase
          .from('customer_information')
          .select('school_name')
          .eq('school_email', userEmail)
          .single()
      
  
        if (error) {
          console.error('Supabase query error:', error)
          throw error
        }
  
        if (data) {
          setSchoolName(data.school_name)
        }
  
      } catch (err: any) {
        console.error('Error fetching school name:', err)
        if (err.message?.includes('not authenticated')) {
          router.push('/login')
          return
        }
      }
    }
  
    fetchSchoolName()
  }, [router])
  const reportOptions = [
    { id: "salary", label: "Salary Distribution" },
    { id: "major", label: "Major Distribution" },
    { id: "graduate_school", label: "Graduate School Distribution" },
    { id: "location", label: "Geographic Distribution"},
    { id: "industry", label: "Industry Sectors" },
  ]

  const years = Array.from({ length: 2024 - 1950 + 1 }, (_, i) => (2024 - i).toString())
  const decades = Array.from({ length: 8 }, (_, i) => `${2020 - i * 10}s`)

  const toggleOption = (id: string) => {
    setSelectedOptions((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const selectAllYears = () => {
    setSelectedYears(years)
    setYearInput("")
    setSuggestedYears([])
  }

  const handleYearInput = (input: string) => {
    setYearInput(input)
    if (input) {
      const suggestions = isDecadeView
        ? decades.filter((decade) => decade.startsWith(input)).slice(0, 5)
        : years.filter((year) => year.startsWith(input)).slice(0, 5)
      setSuggestedYears([
        "Select All Years",
        "Clear",
        isDecadeView ? "Select by Year" : "Select by Decade",
        ...suggestions,
      ])
    } else {
      setSuggestedYears(["Select All Years", "Clear", isDecadeView ? "Select by Year" : "Select by Decade"])
    }
  }

  const selectYear = (year: string) => {
    if (year === "Select All Years") {
      selectAllYears()
    } else if (year === "Clear") {
      setSelectedYears([])
    } else if (year === "Select by Decade" || year === "Select by Year") {
      setIsDecadeView(!isDecadeView)
      setYearInput("")
      handleYearInput("")
    } else if (isDecadeView) {
      const decadeStart = Number.parseInt(year)
      const decadeYears = Array.from({ length: 10 }, (_, i) => (decadeStart + i).toString())
      setSelectedYears((prev) => [...new Set([...prev, ...decadeYears])])
    } else if (!selectedYears.includes(year)) {
      setSelectedYears((prev) => [...prev, year])
    }
    setYearInput("")
    setSuggestedYears([])
  }

  const removeYear = (year: string) => {
    setSelectedYears((prev) => prev.filter((y) => y !== year))
  }

  const handleGenerateReport = async () => {
    console.log('Starting report generation with:', { selectedOptions, selectedYears })
    setIsLoading(true)
    try {
      setGeneratedReport({
        options: selectedOptions,
        years: selectedYears
      })
      console.log('Report generated successfully:', { selectedOptions, selectedYears })
    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async () => {
    if (reportRef.current === null) {
      return
    }

    try {
      const dataUrl = await htmlToImage.toPng(reportRef.current, { quality: 0.95 })
      saveAs(dataUrl, "alumni-success-metrics-report.png")
    } catch (error) {
      console.error("Error generating report image:", error)
    }
  }

  useEffect(() => {
    if (selectedOptions.includes('salary') && selectedYears.length > 0 && schoolName) {
      const fetchSalaryData = async () => {
        const { data, error } = await supabase
          .from(schoolName + '_distribution')
          .select('current_salary_distribuiton, class_year')
          .in('class_year', selectedYears)
          .not('current_salary_distribuiton', 'is', null);

        if (error) {
          console.error('Error fetching salary data:', error);
          return;
        }

        if (data) {
          setSalaryData(data);
        }
      };

      fetchSalaryData();
    }
  }, [selectedOptions, selectedYears, schoolName]);

  useEffect(() => {
    if (selectedOptions.includes('industry') && selectedYears.length > 0 && schoolName) {
      const fetchIndustryData = async () => {
        const { data, error } = await supabase
          .from(schoolName + '_distribution')
          .select('current_industry_distribuiton, class_year')
          .in('class_year', selectedYears)
          .not('current_industry_distribuiton', 'is', null);

        if (error) {
          console.error('Error fetching industry data:', error);
          return;
        }

        if (data) {
          setIndustryData(data);
        }
      };

      fetchIndustryData();
    }
  }, [selectedOptions, selectedYears, schoolName]);

  useEffect(() => {
    if (selectedOptions.includes('location') && selectedYears.length > 0 && schoolName) {
      const fetchLocationData = async () => {
        const { data, error } = await supabase
          .from(schoolName + '_distribution')
          .select('current_job_location_distribuiton, class_year')
          .in('class_year', selectedYears)
          .not('current_job_location_distribuiton', 'is', null);

        if (error) {
          console.error('Error fetching location data:', error);
          return;
        }

        if (data) {
          // Process the location data
          const locationCounts: { [key: string]: number } = {};
          
          data.forEach(profile => {
            if (profile.current_job_location_distribuiton) {
              Object.entries(profile.current_job_location_distribuiton).forEach(([city, count]) => {
                locationCounts[city] = (locationCounts[city] || 0) + Number(count);
              });
            }
          });

          // Convert to chart format and sort by value
          const chartData = Object.entries(locationCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10); // Take top 10 cities

          setLocationData(chartData);
        }
      };

      fetchLocationData();
    }
  }, [selectedOptions, selectedYears, schoolName]);

  const ReportContent = () => {
    return (
      <div ref={reportRef} className="w-[8.5in] min-h-[11in] bg-white shadow-2xl relative">
        <div className="absolute top-8 left-8 flex items-center">
          <Image src="/icons8-atom-24.png" alt="AlumIntel Logo" width={32} height={32} />
          <span className="ml-2 text-xl font-bold text-emerald-800">AlumIntel</span>
        </div>
        <div className="p-8 pt-20">
          {!generatedReport ? (
            <div className="min-h-[calc(11in-4rem)] flex flex-col items-center justify-center text-gray-500">
              <BarChart4 className="w-16 h-16 mb-4 text-emerald-500" />
              <p>Select data points to preview your report</p>
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Alumni Success Metrics Report</h1>
              {salaryData && selectedOptions.includes('salary') && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold mb-4">Salary Distribution</h3>
                  {selectedYears.map(year => {
                    const yearData = salaryData.find((item: { class_year: number | string }) => 
                      item.class_year.toString() === year.toString()
                    );

                    if (!yearData?.current_salary_breakdown) return null;

                    // Transform the data for the bar chart
                    const chartData = Object.entries(yearData.current_salary_breakdown)
                      .map(([range, count]) => ({
                        name: range.replace('$', '').replace(',', ''),  // Clean up the range format
                        value: count as number,
                        fill: '#4A90E2'
                      }))
                      .sort((a, b) => {
                        const aValue = parseInt(a.name.split('-')[0]);
                        const bValue = parseInt(b.name.split('-')[0]);
                        return aValue - bValue;
                      });

                    return (
                      <div key={year} className="mb-8">
                        <h4 className="text-lg font-medium mb-2">Class of {year}</h4>
                        <div className="h-64">
                          <div className="text-center text-sm text-gray-600 mb-2">Number of Alumni</div>
                          <SalaryBarChart 
                            data={chartData}
                          />
                          <div className="text-center text-sm text-gray-600 mt-2">Salary Ranges ($)</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {industryData && selectedOptions.includes('industry') && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold mb-4">Industry Distribution</h3>
                  {selectedYears.map(year => {
                    const yearData = industryData.find((item: { class_year: number | string }) => 
                      item.class_year.toString() === year.toString()
                    );

                    if (!yearData?.current_industry_breakdown_pie_graph) return null;

                    // Transform the data for the pie chart
                    const chartData = Object.entries(yearData.current_industry_breakdown_pie_graph)
                      .map(([industry, percentage]) => ({
                        name: industry,
                        value: (percentage as number) * 100  // Multiply by 100 to convert decimal to percentage
                      }));

                    return (
                      <div key={year} className="mb-8">
                        <h4 className="text-lg font-medium mb-2">Class of {year}</h4>
                        <div className="h-[400px]">
                          <IndustryPieChart 
                            data={chartData}
                            isZoomed={true}
                            showLegend={true}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {selectedOptions.includes('location') && locationData.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                  <h3 className="text-xl font-semibold mb-4">Geographic Distribution</h3>
                  <div className="h-[400px]">
                    <BarChart
                      data={locationData}
                      isZoomed={true}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="absolute bottom-4 right-4 text-gray-500">Page {currentPage} of 2</div>
      </div>
    )
  }

  return (
    <main className={`flex-1 relative transition-all duration-300 ease-in-out ${isSidebarOpen ? "ml-72" : "ml-24"}`}>
      <div className="p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-3xl font-bold mb-6">Report Builder</h1>

          <div className="flex gap-6 h-[calc(100vh-12rem)]">
            {/* Left Column - Checkboxes and Year Selection */}
            <div className="w-1/3 bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">
                Select Data Points ({selectedOptions.length}/{reportOptions.length})
              </h2>
              <div className="space-y-4">
                {reportOptions.map((option) => (
                  <div key={option.id} className="flex items-center">
                    <button
                      className={`w-6 h-6 rounded ${
                        selectedOptions.includes(option.id)
                          ? "bg-emerald-500 text-white"
                          : "bg-white border border-gray-300 hover:border-emerald-500"
                      } mr-3 flex items-center justify-center transition-colors`}
                      onClick={() => toggleOption(option.id)}
                    >
                      {selectedOptions.includes(option.id) && <Check className="w-4 h-4" />}
                    </button>
                    <label
                      htmlFor={option.id}
                      className="text-gray-700 cursor-pointer flex-grow"
                      onClick={() => toggleOption(option.id)}
                    >
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>

              <h2 className="text-xl font-semibold mb-4 mt-8">Select Class Years</h2>
              <div className="relative mb-4">
                <input
                  type="text"
                  value={yearInput}
                  onChange={(e) => handleYearInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (years.includes(yearInput) && !selectedYears.includes(yearInput)) {
                        selectYear(yearInput)
                      }
                    }
                  }}
                  placeholder="Search years..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                {suggestedYears.length > 0 && (
                  <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-auto">
                    {suggestedYears.map((year, index) => (
                      <li
                        key={index}
                        onClick={() => selectYear(year)}
                        className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${
                          year === "Select All Years"
                            ? "font-semibold text-emerald-600 border-b border-gray-200"
                            : year === "Clear"
                              ? "font-semibold text-red-600 border-b border-gray-200"
                              : year === "Select by Decade" || year === "Select by Year"
                                ? "font-semibold text-blue-600 border-b border-gray-200"
                                : ""
                        }`}
                      >
                        {year}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="mb-4 border border-gray-200 rounded-lg p-2">
                <div className="h-20 overflow-y-auto">
                  <div className="grid grid-cols-5 gap-1">
                    {selectedYears.map((year) => (
                      <div
                        key={year}
                        className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md flex items-center justify-between text-sm"
                      >
                        <span className="truncate">{year}</span>
                        <button
                          onClick={() => removeYear(year)}
                          className="ml-1 text-emerald-600 hover:text-emerald-800 flex-shrink-0"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={handleGenerateReport}
                className={`w-full ${
                  isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:scale-107 transform transition-transform duration-300"
                } text-white py-2 px-4 rounded-md mt-6 flex items-center justify-center`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  "Generate Report"
                )}
              </button>
            </div>

            {/* Right Column - Report Preview */}
            <div className="w-2/3 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Report Preview</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={handleDownload}
                    className="bg-black text-white py-2 px-4 rounded-md hover:scale-107 transform transition-transform duration-300 flex items-center"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Report
                  </button>
                  <button
                    onClick={() => setIsExpanded(true)}
                    className="bg-black text-white py-2 px-4 rounded-md hover:scale-107 transform transition-transform duration-300 flex items-center"
                  >
                    <Maximize2 className="w-4 h-4 mr-2" />
                    Expand Preview
                  </button>
                </div>
              </div>
              <div className="flex-1 bg-gray-700 rounded-lg overflow-auto">
                <div className="min-h-full p-8 flex justify-center">
                  <ReportContent />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-gray-700 p-8 max-w-4xl w-full max-h-[90vh] overflow-auto relative rounded-lg"
            >
              <button
                onClick={() => setIsExpanded(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
              <ReportContent />
              <div className="mt-4 flex justify-center space-x-4">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous Page
                </button>
                <button
                  onClick={() => setCurrentPage(2)}
                  disabled={currentPage === 2}
                  className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next Page
                  <ChevronRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}

