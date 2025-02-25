"use client"

import { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, RefreshCw, Info } from "lucide-react"
import { BarChart, LineChart, PieChart } from "../../components/chart"
import Sidebar from "../../components/Sidebar"
import { useSidebar } from "../../components/SidebarProvider"
import { supabase } from "../data/supabase"
import NetworkVisualization from '../../components/network-visualization-1'
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"
import { useSchool } from "../contexts/SchoolContext"
import { getUserEmail } from "../utils/auth"

interface UserInfo {
  first_name: string
  last_name: string
}

interface SchoolChartData {
  id: string;
  title: string;
  type: string;
  year?: string;
}

function YearSelector({ selectedYear, onChange }: { selectedYear: string, onChange: (year: string) => void }) {
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

export default function DataInsightsPage() {
  const { isSidebarOpen } = useSidebar()
  const searchParams = useSearchParams()
  const fromSignin = searchParams.get('fromSignin') === 'true'
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

  // Define the four specific charts we want to show
  const schoolCharts: SchoolChartData[] = [
    { id: "salary", title: "Salary Distribution", type: "salary" },
    { id: "industry", title: "Industry Sectors", type: "industry" },
    { id: "location", title: "Geographic Distribution", type: "location" },
    { id: "graduate_school", title: "Graduate School Distribution", type: "graduate_school" }
  ];

  useEffect(() => {
    const initializePage = async () => {
      try {
        // Only start progress animation if coming from signin
        let progressInterval: NodeJS.Timeout | null = null
        
        if (fromSignin) {
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
        const userEmail = await getUserEmail()

        if (userEmail) {
          const { data, error } = await supabase
            .from("customer_information")
            .select("first_name, last_name")
            .eq("school_email", userEmail)
            .single()

          if (error) {
            console.error("Error fetching user info:", error)
            return
          }

          if (data) {
            setUserInfo(data)
          }
        }

        // Set the charts to our predefined school charts
        setCharts(schoolCharts)
        setSearchResults(schoolCharts)

        if (progressInterval) clearInterval(progressInterval)
        setIsLoading(false)
      } catch (error) {
        console.error("Error initializing page:", error)
        setIsLoading(false)
      }
    }

    initializePage()
  }, [fromSignin])

  const fetchSchoolData = async () => {
    if (!schoolName) return
    
    try {
      const tableName = schoolName.toLowerCase().replace(/\s+/g, '_') + '_distribution'
      
      // Fetch all data for the selected year
      const { data: salaryData, error: salaryError } = await supabase
        .from(tableName)
        .select('current_salary_distribuiton, class_year')
        .eq('class_year', selectedYear)
      
      if (salaryError) {
        console.error('Error fetching salary data:', salaryError)
      } else if (salaryData && salaryData.length > 0) {
        setSalaryData(salaryData[0].current_salary_distribuiton)
      }
      
      const { data: industryData, error: industryError } = await supabase
        .from(tableName)
        .select('current_industry_distribuiton, class_year')
        .eq('class_year', selectedYear)
      
      if (industryError) {
        console.error('Error fetching industry data:', industryError)
      } else if (industryData && industryData.length > 0) {
        setIndustryData(industryData[0].current_industry_distribuiton)
      }
      
      const { data: locationData, error: locationError } = await supabase
        .from(tableName)
        .select('current_job_location_distribuiton, class_year')
        .eq('class_year', selectedYear)
      
      if (locationError) {
        console.error('Error fetching location data:', locationError)
      } else if (locationData && locationData.length > 0) {
        // Process location data
        const locationCounts: { [key: string]: number } = {};
        
        if (locationData[0].current_job_location_distribuiton) {
          Object.entries(locationData[0].current_job_location_distribuiton).forEach(([city, count]) => {
            locationCounts[city] = Number(count);
          });
        }
        
        // Convert to chart format and sort by value
        const chartData = Object.entries(locationCounts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10); // Take top 10 cities
        
        setLocationData(chartData);
      }
      
      const { data: gradSchoolData, error: gradSchoolError } = await supabase
        .from(tableName)
        .select('graduate_school_distribuiton, class_year')
        .eq('class_year', selectedYear)
      
      if (gradSchoolError) {
        console.error('Error fetching graduate school data:', gradSchoolError)
      } else if (gradSchoolData && gradSchoolData.length > 0) {
        setGraduateSchoolData(gradSchoolData[0].graduate_school_distribuiton)
      }
      
    } catch (error) {
      console.error('Error fetching school data:', error)
    }
  }

  useEffect(() => {
    if (schoolName && selectedYear) {
      fetchSchoolData()
    }
  }, [schoolName, selectedYear])

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query)
      if (query.trim() === "") {
        setSearchResults(charts)
      } else {
        const filteredResults = charts.filter((chart) => 
          chart.title.toLowerCase().includes(query.toLowerCase())
        )
        setSearchResults(filteredResults)
      }
    },
    [charts],
  )

  const renderChart = (chart: SchoolChartData) => {
    switch (chart.type) {
      case "salary":
        return <BarChart data={salaryData} />
      case "industry":
        return <PieChart data={industryData} />
      case "location":
        return <BarChart data={locationData} />
      case "graduate_school":
        return <PieChart data={graduateSchoolData} />
      default:
        return <div>Unsupported chart type</div>
    }
  }

  const handleWidgetClick = (chart: SchoolChartData) => {
    setSelectedChart(chart)
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
            <Image src="/assets/icons8-atom-96.png" alt="AlumIntel Logo" width={96} height={96} className="mx-auto mb-8" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {searchResults.map((chart) => (
              <motion.div
                key={chart.id}
                layoutId={`chart-${chart.id}`}
                onClick={() => handleWidgetClick(chart)}
                className="bg-white rounded-lg p-6 cursor-pointer shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-medium text-gray-900">{chart.title}</h3>
                  <Info className="w-4 h-4 text-gray-400" />
                </div>
                <div className="h-56 flex items-center justify-center">{renderChart(chart)}</div>
              </motion.div>
            ))}
          </div>
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
          <YearSelector 
            selectedYear={selectedYear} 
            onChange={setSelectedYear}
          />
          <button
            onClick={() => window.location.reload()}
            className="p-2 bg-white rounded-lg border border-gray-200 text-gray-600 hover:text-[#1c3d4c] transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </main>
    </div>
  )
}