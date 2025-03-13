"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, RefreshCw } from "lucide-react"
import { BarChart, PieChart } from "../../components/chart"
import Sidebar from "../../components/Sidebar"
import { useSidebar } from "../../components/SidebarProvider"
import { supabase } from "../data/supabase"
import NetworkVisualization from "../../components/network-visualization-1"
import Image from "next/image"
import { useSearchParams, useRouter } from "next/navigation"
import { useSchool } from "../contexts/SchoolContext"
import { getUserEmail, isAuthenticated } from "../utils/auth"
import { SalaryBarChart, GeographyBarChart } from "../../components/chart"
import { AverageSalaryByIndustryBarChart } from "../../components/chart"
import { IndustryStackedBarChart } from "../../components/chart"

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
      className="w-24 px-3 py-2 bg-white border border-black rounded-lg focus:outline-none focus:border-[#1c3d4c] text-gray-900 placeholder-gray-400"
    />
  )
}

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
  const [industrySalaryData, setIndustrySalaryData] = useState<Array<{ name: string; value: number }>>([])
  const [industryProgressionData, setIndustryProgressionData] = useState<any[]>([])
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({})
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: 'What would you like to know about this data?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter()
  const [isChatExpanded, setIsChatExpanded] = useState(false);

  // Define the five specific charts we want to show (added industry salary chart)
  const schoolCharts: SchoolChartData[] = [
    { id: "salary", title: "Salary Distribution", type: "salary" },
    { id: "industry", title: "Industry Sectors", type: "industry" },
    { id: "location", title: "Geographic Distribution", type: "location" },
    { id: "graduate_school", title: "Graduate School Distribution", type: "graduate_school" },
    { id: "industry_salary", title: "Average Salary by Industry", type: "industry_salary" },
    // Commenting out industry progression chart
    // { id: "industry_progression", title: "Industry Progression Over Time", type: "industry_progression" },
  ]

  useEffect(() => {
    const initializePage = async () => {
      let progressInterval: NodeJS.Timeout | null = null;
      
      try {
        // Check if user is authenticated
        const authenticated = await isAuthenticated()
        if (!authenticated) {
          router.push('/signin')
          return
        }

        setDebugInfo({ authChecked: true, isAuthenticated: authenticated })
        
        // Get user email
        const userEmail = await getUserEmail()
        setDebugInfo((prev: Record<string, any>) => ({ ...prev, userEmail }))

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

        if (fromSignin) {
          const startTime = Date.now()
          const duration = 2500

          progressInterval = setInterval(() => {
            // Your existing interval code...
          }, 16)
          
          // Rest of your code...
        }
        
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
        if (salaryData && salaryData.length > 0 && salaryData[0].current_salary_distribution) {
          console.log("DEBUG: Raw salary data:", salaryData[0].current_salary_distribution);
          
          // Transform the object format into the array format expected by BarChart
          const chartData = Object.entries(salaryData[0].current_salary_distribution)
            .map(([range, count]) => ({ 
              name: range, 
              value: typeof count === 'number' ? count : Number(count) 
            }))
            .sort((a, b) => {
              // Sort by salary range
              const aStart = parseInt(a.name.split('-')[0].replace(/\D/g, ''));
              const bStart = parseInt(b.name.split('-')[0].replace(/\D/g, ''));
              return !isNaN(aStart) && !isNaN(bStart) ? aStart - bStart : 0;
            });
          
          console.log("DEBUG: Transformed salary data:", chartData);
          setSalaryData(chartData);
        } else {
          console.warn("DEBUG: No salary data found for year:", selectedYear);
          setSalaryData(null);
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
        if (industryData && industryData.length > 0 && industryData[0].current_industry_distribution) {
          console.log("DEBUG: Setting industry data:", industryData[0].current_industry_distribution)
          const formattedData = Object.entries(industryData[0].current_industry_distribution)
            .map(([name, value]) => ({ 
              name, 
              value: typeof value === 'number' ? value : Number(value) 
            }));
          setIndustryData(formattedData);
        } else {
          console.warn("DEBUG: No industry data found for year:", selectedYear)
          setIndustryData([]);
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
        
        // Add detailed debugging for the raw location distribution data
        if (locationData && locationData.length > 0 && locationData[0].current_job_location_distribution) {
          console.log("DEBUG: Raw current_job_location_distribution object:", 
            JSON.stringify(locationData[0].current_job_location_distribution, null, 2));
          
          // Log each location entry individually for clarity
          console.log("DEBUG: Location entries (name: count):");
          Object.entries(locationData[0].current_job_location_distribution).forEach(([location, count]) => {
            console.log(`  "${location}": ${count}`);
          });
        }
        
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
        if (gradSchoolData && gradSchoolData.length > 0 && gradSchoolData[0].graduate_school_distribution) {
          console.log("DEBUG: Setting graduate school data:", gradSchoolData[0].graduate_school_distribution)
          const formattedData = Object.entries(gradSchoolData[0].graduate_school_distribution)
            .map(([name, value]) => ({ 
              name, 
              value: typeof value === 'number' ? value : Number(value) 
            }));
          setGraduateSchoolData(formattedData);
        } else {
          console.warn("DEBUG: No graduate school data found for year:", selectedYear)
          setGraduateSchoolData([]);
        }
      }

      // Fetch industry salary data
      console.log("DEBUG: Fetching industry salary data...")
      const { data: industrySalaryData, error: industrySalaryError } = await supabase
        .from(tableName)
        .select("average_salary_by_industry_distribution, class_year")
        .eq("class_year", selectedYear)

      if (industrySalaryError) {
        console.error("Error fetching industry salary data:", industrySalaryError)
        setDebugInfo((prev: Record<string, any>) => ({ ...prev, industrySalaryError }))
      } else {
        console.log("DEBUG: Industry salary data response:", industrySalaryData)
        setDebugInfo((prev: Record<string, any>) => ({ ...prev, industrySalaryData }))
        if (industrySalaryData && industrySalaryData.length > 0 && industrySalaryData[0].average_salary_by_industry_distribution) {
          console.log("DEBUG: Raw industry salary data:", industrySalaryData[0].average_salary_by_industry_distribution);
          
          // Transform the object format into the array format expected by BarChart
          const chartData = Object.entries(industrySalaryData[0].average_salary_by_industry_distribution)
            .map(([industry, salary]) => ({ 
              name: industry, 
              value: typeof salary === 'number' ? salary : Number(salary) 
            }))
            .sort((a, b) => b.value - a.value); // Sort by salary (highest first)
          
          console.log("DEBUG: Transformed industry salary data:", chartData);
          setIndustrySalaryData(chartData);
        } else {
          // If no real data, use sample data for demonstration
          const sampleIndustrySalaryData = [
            { name: "Technology & Software", value: 110000 },
            { name: "Financial Services", value: 95000 },
            { name: "Healthcare & Pharmaceuticals", value: 85000 },
            { name: "Education", value: 65000 },
            { name: "Manufacturing", value: 75000 }
          ];
          setIndustrySalaryData(sampleIndustrySalaryData);
          console.warn("DEBUG: No industry salary data found for year:", selectedYear);
        }
      }

      // Commenting out industry progression data fetch
      /*
      // Fetch industry progression data
      console.log("DEBUG: Fetching industry progression data...")
      const { data: industryProgressionData, error: industryProgressionError } = await supabase
        .from(tableName)
        .select("industry_progression_data, class_year")
        .eq("class_year", selectedYear)
      
      if (industryProgressionError) {
        console.error("Error fetching industry progression data:", industryProgressionError)
        setDebugInfo((prev: Record<string, any>) => ({ ...prev, industryProgressionError }))
      } else {
        console.log("DEBUG: Industry progression data response:", industryProgressionData)
        setDebugInfo((prev: Record<string, any>) => ({ ...prev, industryProgressionData }))
        if (industryProgressionData && industryProgressionData.length > 0 && industryProgressionData[0].industry_progression_data) {
          console.log("DEBUG: Raw industry progression data:", industryProgressionData[0].industry_progression_data);
          setIndustryProgressionData(industryProgressionData[0].industry_progression_data);
        } else {
          // Sample data if no real data is available
          const sampleData = [
            {
              "industries": {
                "Technology & Software": { "count": 15 },
                "Financial Services": { "count": 10 },
                "Healthcare & Pharmaceuticals": { "count": 8 }
              },
              "years_after": 1
            },
            {
              "industries": {
                "Technology & Software": { "count": 20 },
                "Financial Services": { "count": 12 },
                "Healthcare & Pharmaceuticals": { "count": 5 },
                "Education": { "count": 7 }
              },
              "years_after": 3
            },
            {
              "industries": {
                "Technology & Software": { "count": 25 },
                "Financial Services": { "count": 15 },
                "Healthcare & Pharmaceuticals": { "count": 10 },
                "Education": { "count": 5 },
                "Manufacturing": { "count": 8 }
              },
              "years_after": 5
            }
          ];
          setIndustryProgressionData(sampleData);
          console.warn("DEBUG: No industry progression data found for year:", selectedYear);
        }
      }
      */
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
    switch (chart.type) {
      case "salary":
        return salaryData && Array.isArray(salaryData) ? (
          <SalaryBarChart data={salaryData} isZoomed={selectedChart?.id === chart.id} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">Loading salary data...</div>
        )
      case "industry":
        return industryData ? (
          <PieChart data={industryData} isZoomed={selectedChart?.id === chart.id} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">Loading industry data...</div>
        )
      case "location":
        return locationData && Array.isArray(locationData) && locationData.length > 0 ? (
          <GeographyBarChart data={locationData} isZoomed={selectedChart?.id === chart.id} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">Loading location data...</div>
        )
      case "graduate_school":
        return graduateSchoolData ? (
          <PieChart data={graduateSchoolData} isZoomed={selectedChart?.id === chart.id} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">Loading graduate school data...</div>
        )
      case "industry_salary":
        return industrySalaryData && Array.isArray(industrySalaryData) && industrySalaryData.length > 0 ? (
          <AverageSalaryByIndustryBarChart data={industrySalaryData} isZoomed={selectedChart?.id === chart.id} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">Loading industry salary data...</div>
        )
      // Commenting out industry progression case
      /*
      case "industry_progression":
        return industryProgressionData && industryProgressionData.length > 0 ? (
          <IndustryStackedBarChart data={industryProgressionData} isZoomed={selectedChart?.id === chart.id} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">Loading industry progression data...</div>
        )
      */
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

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isSending || !selectedChart) return;
    
    const userMessage = { role: 'user' as const, content: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsSending(true);

    console.log("NIGGA DEBUG: Sending message:")
    
    try {
      // Get the appropriate chart data based on the selected chart type
      const chartData = 
        selectedChart.type === 'salary' ? salaryData : 
        selectedChart.type === 'industry' ? industryData :
        selectedChart.type === 'location' ? locationData : 
        selectedChart.type === 'graduate_school' ? graduateSchoolData : null;
      
        console.log("NIGGA DEBUG: LOCATION Chart data:", locationData)
      // Use the actual API endpoint with the chart data
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatMessages, userMessage],
          chartId: selectedChart.id,
          chartType: selectedChart.type,
          chartTitle: selectedChart.title,
          chartData: chartData
        })
      });
      
      if (!response.ok) throw new Error('Failed to send message');
      
      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');
      
      let assistantMessage = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Convert the chunk to text
        const chunk = new TextDecoder().decode(value);
        
        // Process each line (event)
        const lines = chunk.split('\n\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              assistantMessage += data.content || '';
              
              // Update the message in real-time
              setChatMessages(prev => {
                const newMessages = [...prev];
                // Check if we already added an assistant message
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage.role === 'assistant' && newMessages.length > chatMessages.length) {
                  // Update existing message
                  lastMessage.content = assistantMessage;
                  return newMessages;
                } else {
                  // Add new assistant message
                  return [...newMessages, { role: 'assistant', content: assistantMessage }];
                }
              });
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error processing your request.' 
      }]);
    } finally {
      setIsSending(false);
    }
  };
  
  // Add this effect to scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const renderExpandedWidget = () => {
    if (!selectedChart) return null;

    return (
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-md z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedChart(null)}
        >
          <motion.div
            className="bg-white rounded-xl overflow-hidden w-full max-w-[1400px] h-[80vh] flex flex-col"
            layoutId={`chart-${selectedChart.id}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-full w-full overflow-hidden">
              {/* Left side - Chart visualization */}
              <div className={`transition-all duration-300 ${isChatExpanded ? "hidden" : "flex-1"} p-8 flex flex-col overflow-hidden`}>
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
                      className="px-4 py-2 bg-black text-white rounded-lg hover:scale-107 transform transition-transform duration-300"
                    >
                      Update Year
                    </button>
                  </div>
                </div>

                {/* Chart content - with vertical centering */}
                <motion.div 
                  layoutId={`chart-content-${selectedChart.id}`} 
                  className="flex-1 flex items-center justify-center overflow-hidden"
                >
                  <div className="w-full" style={{ height: "75%" }}>
                    {renderChart(selectedChart)}
                  </div>
                </motion.div>
              </div>

              {/* Chat sidebar */}
              <motion.div
                className={`transition-all duration-300 ${isChatExpanded ? "w-full" : "w-1/3"} border-l border-gray-200 flex flex-col bg-gray-50 relative`}
              >
                {/* Toggle button for chat expansion */}
                <button 
                  onClick={() => setIsChatExpanded(!isChatExpanded)} 
                  className="absolute -left-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-1.5 shadow-md border border-gray-200 z-10 hover:bg-gray-50"
                >
                  {isChatExpanded ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 18 6-6-6-6"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m15 18-6-6 6-6"/>
                    </svg>
                  )}
                </button>

                <div className="p-4 border-b border-gray-200 bg-white">
                  <h3 className="font-semibold text-gray-800">Chat with AI Assistant</h3>
                  <p className="text-sm text-gray-500">Ask questions about this data</p>
                </div>

                {/* Chat messages area */}
                <div className="flex-1 p-4 overflow-auto">
                  {chatMessages.map((msg, index) => (
                    <div 
                      key={index} 
                      className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
                    >
                      <div 
                        className={`inline-block p-3 rounded-lg max-w-[85%] ${
                          msg.role === 'user' 
                            ? 'bg-golden-yellow/30 text-gray-900' 
                            : 'bg-green-800/10 text-gray-700'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat input */}
                <div className="p-4 border-t border-gray-200 bg-white">
                  <div className="flex gap-2 border border-black rounded-lg p-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Ask a question about this data..."
                      className="flex-1 px-3 py-2 border-none text-black placeholder-black-800 focus:outline-none focus:ring-2 focus:ring-forest-green-500"
                      disabled={isSending}
                    />
                    <button 
                      onClick={handleSendMessage}
                      disabled={isSending}
                      className="px-4 py-2 bg-black text-white rounded-lg hover:scale-105 transform transition-transform duration-300 disabled:opacity-50"
                    >
                      {isSending ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <span>Send</span>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  // Add this effect to reset chat messages when a new chart is selected
  useEffect(() => {
    if (selectedChart) {
      // Reset chat messages to initial state when a new chart is selected
      setChatMessages([
        { role: 'assistant', content: 'What would you like to know about this data?' }
      ]);
    }
  }, [selectedChart]); // This effect runs whenever selectedChart changes

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
        <div className="p-8 pt-20">

          {/* Check if searchResults exists before mapping */}
          {searchResults && searchResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((chart) => (
                <motion.div
                  key={chart.id}
                  layoutId={`chart-${chart.id}`}
                  onClick={() => handleWidgetClick(chart)}
                  className={`bg-white rounded-lg p-6 cursor-pointer border border-black shadow-lg transition-shadow h-[500px] flex flex-col ${
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
              className="pl-10 pr-4 py-2 bg-white border border-black rounded-lg focus:outline-none focus:border-[#1c3d4c] text-black placeholder-black-800"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              aria-label="Search graph titles"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black w-4 h-4" />
          </div>
          <YearSelector selectedYear={selectedYear} onChange={setSelectedYear} />
          <button
            onClick={() => window.location.reload()}
            className="p-2 bg-black text-white rounded-lg border border-black hover:bg-gray-900 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </main>
      {selectedChart && renderExpandedWidget()}
    </div>
  )
}

