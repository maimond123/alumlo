"use client"

import { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, RefreshCw } from "lucide-react"
import { BarChart, PieChart } from "../../components/chart"
import Sidebar from "../../components/Sidebar"
import { useSidebar } from "../../components/SidebarProvider"
import { supabase } from "../data/supabase"
import NetworkVisualization from "../../components/network-visualization-1"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { useSchool } from "../contexts/SchoolContext"
import { getUserEmail } from "../utils/auth"

interface UserInfo {
  first_name: string
  last_name: string
}

interface SchoolChartData {
  id: string
  title: string
  type: string
  year?: string
}

function YearSelector({ selectedYear, onChange }: { selectedYear: string; onChange: (year: string) => void }) {
  return (
    <input
      type="number"
      value={selectedYear}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Year"
      min="1950"
      max="2024"
      className="w-24 px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#1c3d4c] text-gray-900 placeholder-gray-400"
    />
  )
}

// Add this utility function to help with debugging element dimensions
const logElementDimensions = (element: HTMLElement | null, label: string) => {
  if (!element) return;
  
  const rect = element.getBoundingClientRect();
  console.log(`DEBUG: ${label} dimensions:`, {
    width: rect.width,
    height: rect.height,
    top: rect.top,
    left: rect.left,
    bottom: rect.bottom,
    right: rect.right,
    element
  });
};

export default function DataInsightsPage() {
  const { isSidebarOpen } = useSidebar()
  const searchParams = useSearchParams()
  const fromSignin = searchParams.get("fromSignin") === "true"
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SchoolChartData[]>([])
  const [charts, setCharts] = useState<SchoolChartData[]>([])
  const [selectedChart, setSelectedChart] = useState<SchoolChartData | null>(null)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const { schoolName } = useSchool()
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [expandedYear, setExpandedYear] = useState(selectedYear)
  const [salaryData, setSalaryData] = useState<any>(null)
  const [industryData, setIndustryData] = useState<any>(null)
  const [locationData, setLocationData] = useState<Array<{ name: string; value: number }>>([])
  const [graduateSchoolData, setGraduateSchoolData] = useState<any>(null)
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({})

  // Define the four specific charts we want to show
  const schoolCharts: SchoolChartData[] = [
    { id: "salary", title: "Salary Distribution", type: "salary" },
    { id: "industry", title: "Industry Sectors", type: "industry" },
    { id: "location", title: "Geographic Distribution", type: "location" },
    { id: "graduate_school", title: "Graduate School Distribution", type: "graduate_school" },
  ]

  useEffect(() => {
    const initializePage = async () => {
      try {
        console.log("DEBUG: Initializing page...")
        // Only start progress animation if coming from signin
        let progressInterval: NodeJS.Timeout | null = null

        if (fromSignin) {
          console.log("DEBUG: Coming from signin, starting progress animation")
          const startTime = Date.now()
          const duration = 2500

          progressInterval = setInterval(() => {
            const elapsed = Date.now() - startTime
            const newProgress = Math.min((elapsed / duration) * 100, 100)
            setProgress(newProgress)

            if (elapsed >= duration) {
              if (progressInterval) clearInterval(progressInterval)
            }
          }, 16)

          // Wait for the full duration before completing if from signin
          await new Promise((resolve) => setTimeout(resolve, duration))
        }

        // Get user info
        console.log("DEBUG: Getting user email...")
        const userEmail = await getUserEmail()
        console.log("DEBUG: User email:", userEmail)

        if (userEmail) {
          console.log("DEBUG: Fetching user info from Supabase...")
          const { data, error } = await supabase
            .from("customer_information")
            .select("first_name, last_name")
            .eq("school_email", userEmail)
            .single()

          if (error) {
            console.error("Error fetching user info:", error)
            setDebugInfo((prev: Record<string, any>) => ({ ...prev, userInfoError: error }))
            return
          }

          if (data) {
            console.log("DEBUG: User info retrieved:", data)
            setUserInfo(data)
            setDebugInfo((prev: Record<string, any>) => ({ ...prev, userInfo: data }))
          }
        }

        // Set the charts to our predefined school charts
        console.log("DEBUG: Setting charts to:", schoolCharts)
        setCharts(schoolCharts)
        setSearchResults(schoolCharts)
        setDebugInfo((prev: Record<string, any>) => ({ ...prev, chartsSet: true, schoolCharts }))

        if (progressInterval) clearInterval(progressInterval)
        setIsLoading(false)
      } catch (error) {
        console.error("Error initializing page:", error)
        setDebugInfo((prev: Record<string, any>) => ({ ...prev, initError: error }))
        setIsLoading(false)
      }
    }

    initializePage()
  }, [fromSignin])

  // Add this at the top of your component
  useEffect(() => {
    console.log("DEBUG: Component mounted, initial state:", {
      schoolName,
      selectedYear,
      isSchoolNameSet: Boolean(schoolName),
      isSelectedYearSet: Boolean(selectedYear),
    })
  }, [])

  // Add this to track when schoolName changes
  useEffect(() => {
    console.log("DEBUG: schoolName changed:", {
      schoolName,
      schoolNameType: typeof schoolName,
      timestamp: new Date().toISOString(),
    })

    // Force a data fetch when schoolName becomes available
    if (schoolName) {
      console.log("DEBUG: schoolName is now available, triggering fetchSchoolData")
      fetchSchoolData()
    }
  }, [schoolName])

  // Modify your existing useEffect for schoolName/selectedYear
  useEffect(() => {
    console.log("DEBUG: schoolName or selectedYear changed", {
      schoolName,
      selectedYear,
      schoolNameType: typeof schoolName,
      selectedYearType: typeof selectedYear,
      timestamp: new Date().toISOString(),
    })

    if (schoolName && selectedYear) {
      console.log("DEBUG: Both schoolName and selectedYear available, calling fetchSchoolData")
      fetchSchoolData()
    } else {
      console.log("DEBUG: Not fetching data because:", {
        hasSchoolName: Boolean(schoolName),
        hasSelectedYear: Boolean(selectedYear),
      })
    }
  }, [schoolName, selectedYear])

  // Modify the beginning of fetchSchoolData to add more diagnostics
  const fetchSchoolData = async () => {
    console.log("DEBUG: fetchSchoolData called with:", {
      schoolName,
      selectedYear,
      timestamp: new Date().toISOString(),
    })

    if (!schoolName) {
      console.error("DEBUG: No school name available, cannot fetch data")
      setDebugInfo((prev: Record<string, any>) => ({ ...prev, fetchError: "No school name available" }))
      return
    }

    try {
      const tableName = schoolName.toLowerCase().replace(/\s+/g, "_") + "_distribution"
      console.log(`DEBUG: Will fetch from table: ${tableName} for year: ${selectedYear}`)

      // Add a check to see if the table exists
      try {
        const { count, error: tableCheckError } = await supabase
          .from(tableName)
          .select("*", { count: "exact", head: true })

        console.log(`DEBUG: Table check result for ${tableName}:`, { count, tableCheckError })

        if (tableCheckError) {
          console.error(`DEBUG: Table ${tableName} check error:`, tableCheckError)
          setDebugInfo((prev: Record<string, any>) => ({ ...prev, tableError: tableCheckError }))
        }
      } catch (tableError) {
        console.error(`DEBUG: Error checking table ${tableName}:`, tableError)
      }

      // Continue with your existing code...
      // Fetch salary data
      console.log("DEBUG: Fetching salary data...")
      const { data: salaryData, error: salaryError } = await supabase
        .from(tableName)
        .select("current_salary_distribution, class_year")
        .eq("class_year", selectedYear)

      if (salaryError) {
        console.error("Error fetching salary data:", salaryError)
        setDebugInfo((prev: Record<string, any>) => ({ ...prev, salaryError }))
      } else {
        console.log("DEBUG: Salary data response:", salaryData)
        setDebugInfo((prev: Record<string, any>) => ({ ...prev, salaryData }))
        if (salaryData && salaryData.length > 0) {
          console.log("DEBUG: Setting salary data:", salaryData[0].current_salary_distribution)
          setSalaryData(salaryData[0].current_salary_distribution)
        } else {
          console.warn("DEBUG: No salary data found for year:", selectedYear)
        }
      }

      // Fetch industry data
      console.log("DEBUG: Fetching industry data...")
      const { data: industryData, error: industryError } = await supabase
        .from(tableName)
        .select("current_industry_distribution, class_year")
        .eq("class_year", selectedYear)

      if (industryError) {
        console.error("Error fetching industry data:", industryError)
        setDebugInfo((prev: Record<string, any>) => ({ ...prev, industryError }))
      } else {
        console.log("DEBUG: Industry data response:", industryData)
        setDebugInfo((prev: Record<string, any>) => ({ ...prev, industryData }))
        if (industryData && industryData.length > 0) {
          console.log("DEBUG: Setting industry data:", industryData[0].current_industry_distribution)
          setIndustryData(industryData[0].current_industry_distribution)
        } else {
          console.warn("DEBUG: No industry data found for year:", selectedYear)
        }
      }

      // Fetch location data
      console.log("DEBUG: Fetching location data...")
      const { data: locationData, error: locationError } = await supabase
        .from(tableName)
        .select("current_job_location_distribution, class_year")
        .eq("class_year", selectedYear)

      if (locationError) {
        console.error("Error fetching location data:", locationError)
        setDebugInfo((prev: Record<string, any>) => ({ ...prev, locationError }))
      } else {
        console.log("DEBUG: Location data response:", locationData)
        setDebugInfo((prev: Record<string, any>) => ({ ...prev, locationData }))
        if (locationData && locationData.length > 0) {
          console.log("DEBUG: Processing location data...")
          // Process location data
          const locationCounts: { [key: string]: number } = {}

          if (locationData[0].current_job_location_distribution) {
            Object.entries(locationData[0].current_job_location_distribution).forEach(([city, count]) => {
              locationCounts[city] = Number(count)
            })

            // Convert to chart format and sort by value
            const chartData = Object.entries(locationCounts)
              .map(([name, value]) => ({ name, value }))
              .sort((a, b) => b.value - a.value)
              .slice(0, 10) // Take top 10 cities

            console.log("DEBUG: Setting location data:", chartData)
            setLocationData(chartData)
          } else {
            console.warn("DEBUG: Location distribution data is null or undefined")
          }
        } else {
          console.warn("DEBUG: No location data found for year:", selectedYear)
        }
      }

      // Fetch graduate school data
      console.log("DEBUG: Fetching graduate school data...")
      const { data: gradSchoolData, error: gradSchoolError } = await supabase
        .from(tableName)
        .select("graduate_school_distribution, class_year")
        .eq("class_year", selectedYear)

      if (gradSchoolError) {
        console.error("Error fetching graduate school data:", gradSchoolError)
        setDebugInfo((prev: Record<string, any>) => ({ ...prev, gradSchoolError }))
      } else {
        console.log("DEBUG: Graduate school data response:", gradSchoolData)
        setDebugInfo((prev: Record<string, any>) => ({ ...prev, gradSchoolData }))
        if (gradSchoolData && gradSchoolData.length > 0) {
          console.log("DEBUG: Setting graduate school data:", gradSchoolData[0].graduate_school_distribution)
          setGraduateSchoolData(gradSchoolData[0].graduate_school_distribution)
        } else {
          console.warn("DEBUG: No graduate school data found for year:", selectedYear)
        }
      }
    } catch (error) {
      console.error("Error fetching school data:", error)
      setDebugInfo((prev: Record<string, any>) => ({ ...prev, fetchError: error }))
    }
  }

  const handleSearch = useCallback(
    (query: string) => {
      console.log("DEBUG: Searching for:", query)
      setSearchQuery(query)
      if (query.trim() === "") {
        console.log("DEBUG: Empty query, showing all charts:", charts)
        setSearchResults(charts)
      } else {
        const filteredResults = charts.filter((chart) => chart.title.toLowerCase().includes(query.toLowerCase()))
        console.log("DEBUG: Filtered results:", filteredResults)
        setSearchResults(filteredResults)
      }
    },
    [charts],
  )

  const renderChart = (chart: SchoolChartData) => {
    console.log(`DEBUG: Rendering chart type: ${chart.type}`, {
      salaryData,
      industryData,
      locationData,
      graduateSchoolData,
      isExpanded: Boolean(selectedChart)
    });
    
    switch (chart.type) {
      case "salary":
        return salaryData ? (
          <div className="w-full h-full">
            <BarChart data={salaryData} />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">No salary data available</div>
        )
      case "industry":
        return industryData ? (
          <div className="w-full h-full">
            <PieChart data={industryData} />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">No industry data available</div>
        )
      case "location":
        return locationData && locationData.length > 0 ? (
          <div 
            className="w-full h-full flex items-stretch"
          >
            <BarChart 
              data={locationData} 
            />
            <div 
              ref={(el) => {
                if (el && selectedChart) {
                  logElementDimensions(el, "BarChart parent element");
                }
              }}
              className="absolute inset-0 pointer-events-none"
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">No location data available</div>
        )
      case "graduate_school":
        return graduateSchoolData ? (
          <div className="w-full h-full">
            <PieChart data={graduateSchoolData} />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">No graduate school data available</div>
        )
      default:
        return <div className="w-full h-full flex items-center justify-center">Unsupported chart type</div>
    }
  }

  const handleWidgetClick = (chart: SchoolChartData) => {
    console.log("DEBUG: Chart clicked:", chart)
    setSelectedChart(chart)
    setExpandedYear(selectedYear)
  }

  const closeExpandedWidget = () => {
    // Create a temporary div to hold the position of the chart
    const tempDiv = document.createElement("div")
    tempDiv.style.position = "absolute"
    tempDiv.style.opacity = "0"
    document.body.appendChild(tempDiv)

    // Set a timeout to remove the chart after the animation completes
    setTimeout(() => {
      setSelectedChart(null)
      // Remove the temporary div after a short delay
      setTimeout(() => {
        document.body.removeChild(tempDiv)
      }, 100)
    }, 10)
  }

  const renderExpandedWidget = () => {
    if (!selectedChart) return null

    // Add a useEffect to log dimensions after render
    useEffect(() => {
      if (selectedChart) {
        setTimeout(() => {
          const chartContainer = document.querySelector('[data-chart-container="true"]');
          logElementDimensions(chartContainer as HTMLElement, "Chart container after render");
          
          const chartElement = chartContainer?.querySelector('[data-chart-element="true"]');
          logElementDimensions(chartElement as HTMLElement, "Chart element after render");
        }, 500); // Wait for layout to settle
      }
    }, [selectedChart]);

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="expanded-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Blurred background overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeExpandedWidget}
          />

          {/* Expanded widget container */}
          <motion.div
            layoutId={`chart-${selectedChart.id}`}
            className="relative bg-white rounded-xl shadow-2xl w-[90vw] h-[80vh] flex overflow-hidden"
            ref={(el) => {
              if (el) {
                logElementDimensions(el, "Expanded widget container");
              }
            }}
          >
            {/* Left side - Chart visualization */}
            <div 
              className="flex-1 p-8 flex flex-col overflow-hidden"
              ref={(el) => {
                if (el) {
                  logElementDimensions(el, "Left panel container");
                }
              }}
            >
              <div className="flex justify-between items-center mb-6">
                <motion.h2 layoutId={`title-${selectedChart.id}`} className="text-2xl font-bold text-gray-800">
                  {selectedChart.title}
                </motion.h2>
                <div className="flex items-center gap-4">
                  <YearSelector selectedYear={expandedYear} onChange={(year) => setExpandedYear(year)} />
                  <button
                    onClick={() => {
                      setSelectedYear(expandedYear)
                      fetchSchoolData()
                    }}
                    className="px-4 py-2 bg-green-800 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Update Year
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search within this data..."
                  className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Search within this data"
                />
              </div>

              {/* Expanded chart visualization */}
              <motion.div 
                layoutId={`chart-content-${selectedChart.id}`}
                className="flex-grow w-full overflow-hidden"
                style={{ 
                  minHeight: 0,
                  height: "calc(100% - 140px)" // Explicit height calculation
                }}
                data-chart-container="true"
                ref={(el) => {
                  if (el) {
                    console.log("DEBUG: Chart container styles:", {
                      width: el.style.width,
                      height: el.style.height,
                      computedWidth: window.getComputedStyle(el).width,
                      computedHeight: window.getComputedStyle(el).height,
                      parentHeight: el.parentElement?.clientHeight
                    });
                    logElementDimensions(el, "Chart container");
                  }
                }}
              >
                <div 
                  className="w-full h-full" 
                  data-chart-element="true"
                  ref={(el) => {
                    if (el) {
                      logElementDimensions(el, "Chart wrapper");
                    }
                  }}
                >
                  {renderChart(selectedChart)}
                </div>
              </motion.div>
            </div>

            {/* Right side - Chat functionality */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="w-1/3 border-l border-gray-200 flex flex-col bg-gray-50"
            >
              <div className="p-4 border-b border-gray-200 bg-white">
                <h3 className="font-semibold text-gray-800">Chat with AI Assistant</h3>
                <p className="text-sm text-gray-500">Ask questions about this data</p>
              </div>

              {/* Chat messages area */}
              <div className="flex-1 p-4 overflow-auto">
                <div className="mb-4 p-3 bg-green-800/10 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">AI Assistant:</span> What would you like to know about this{" "}
                    {selectedChart.title.toLowerCase()} data?
                  </p>
                </div>

                {/* You can add more message components here */}
              </div>

              {/* Chat input */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ask a question about this data..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors">
                    Send
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    )
  }

  if (isLoading && fromSignin) {
    return (
      <div className="min-h-screen bg-white relative overflow-hidden">
        <NetworkVisualization fullScreen />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center z-10"
          >
            <Image
              src="/assets/icons8-atom-96.png"
              alt="AlumIntel Logo"
              width={96}
              height={96}
              className="mx-auto mb-8"
            />
            <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-teal-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1, ease: "linear" }}
              />
            </div>
          </motion.div>
        </div>
        <motion.div
          className="absolute inset-0 bg-emerald-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: progress === 100 ? 1 : 0 }}
          transition={{ duration: 0.5 }}
        />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main style={{ marginLeft: isSidebarOpen ? "18rem" : "5rem" }} className="flex-1 transition-all duration-300">
        <div className="p-8">
          {/* Debug Info Panel - Remove in production */}
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-bold mb-2">Debug Info:</h3>
            <div className="text-xs overflow-auto max-h-40">
              <p>School Name: {schoolName || "Not set"}</p>
              <p>Selected Year: {selectedYear}</p>
              <p>Charts Set: {charts.length > 0 ? "Yes" : "No"}</p>
              <p>Search Results: {searchResults.length}</p>
              <p>
                Data Available:
                {salaryData ? " Salary ✓" : " Salary ✗"}
                {industryData ? " Industry ✓" : " Industry ✗"}
                {locationData && locationData.length > 0 ? " Location ✓" : " Location ✗"}
                {graduateSchoolData ? " Grad School ✓" : " Grad School ✗"}
              </p>
              <details>
                <summary>Full Debug Object</summary>
                <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
              </details>
            </div>
          </div>

          {/* Check if searchResults exists before mapping */}
          {searchResults && searchResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((chart) => (
                <motion.div
                  key={chart.id}
                  layoutId={`chart-${chart.id}`}
                  onClick={() => handleWidgetClick(chart)}
                  className={`bg-white rounded-lg p-6 cursor-pointer shadow-lg transition-shadow h-[500px] flex flex-col ${
                    selectedChart ? "" : "hover:shadow-xl hover:-translate-y-1"
                  }`}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <motion.h3 layoutId={`title-${chart.id}`} className="text-lg font-medium text-gray-900">
                      {chart.title}
                    </motion.h3>
                  </div>
                  <motion.div layoutId={`chart-content-${chart.id}`} className="flex-1 w-full">
                    {renderChart(chart)}
                  </motion.div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow p-6">
              <p className="text-gray-500">No charts available. Please check your data or try a different year.</p>
            </div>
          )}
        </div>

        <div className="fixed top-4 right-4 flex space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search graph titles..."
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#1c3d4c] text-gray-900 placeholder-gray-400"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              aria-label="Search graph titles"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
          <YearSelector selectedYear={selectedYear} onChange={setSelectedYear} />
          <button
            onClick={() => window.location.reload()}
            className="p-2 bg-white rounded-lg border border-gray-200 text-gray-600 hover:text-[#1c3d4c] transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </main>
      {selectedChart && renderExpandedWidget()}
    </div>
  )
}

