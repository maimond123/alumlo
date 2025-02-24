"use client"

import { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, RefreshCw, Info } from "lucide-react"
import { chartData, type ChartData, fetchChartData } from "../data/chartData"
import { BarChart, LineChart, PieChart } from "../../components/chart"
// import ChartScreen from "../../components/ChartScreen"
import Sidebar from "../../components/Sidebar"
import { useSidebar } from "../../components/SidebarProvider"
import { supabase } from "../data/supabase"
import NetworkVisualization from '../../components/network-visualization-1'
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"
import { useSchool } from "../contexts/SchoolContext"
import { getCurrentUser, signOut } from 'aws-amplify/auth'

interface UserInfo {
  first_name: string
  last_name: string
}

export default function DataInsightsPage() {
  const { isSidebarOpen } = useSidebar()
  const searchParams = useSearchParams()
  const fromSignin = searchParams.get('fromSignin') === 'true'
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<ChartData[]>([])
  const [charts, setCharts] = useState<ChartData[]>(chartData)
  const [selectedChart, setSelectedChart] = useState<ChartData | null>(null)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const { schoolName } = useSchool()

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
        const { username: userEmail } = await getCurrentUser()

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

        // Load chart data
        const chartData = await fetchChartData()
        setCharts(chartData)
        setSearchResults(chartData)

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
    if (!schoolName) return []
    
    try {
      const { data, error } = await supabase
        .from(schoolName.toLowerCase().replace(/\s+/g, '_'))
        .select('*')
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching school data:', error)
      return []
    }
  }

  useEffect(() => {
    const loadData = async () => {
      if (schoolName) {
        const data = await fetchSchoolData()
        setCharts(data)
      }
    }
    
    loadData()
  }, [schoolName])

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query)
      if (query.trim() === "") {
        setSearchResults(charts)
      } else {
        const filteredResults = charts.filter((chart) => chart.title.toLowerCase().includes(query.toLowerCase()))
        setSearchResults(filteredResults)
      }
    },
    [charts],
  )

  const renderChart = (chart: ChartData) => {
    switch (chart.type) {
      case "bar":
        return <BarChart data={chart.data} />
      case "line":
        return <LineChart data={chart.data} />
      case "pie":
        return <PieChart data={chart.data} />
      default:
        return <div>Unsupported chart type</div>
    }
  }

  const handleWidgetClick = (chart: ChartData) => {
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
          <button
            onClick={() => window.location.reload()}
            className="p-2 bg-white rounded-lg border border-gray-200 text-gray-600 hover:text-[#1c3d4c] transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Comment out this section */}
        {/*
        <AnimatePresence>
          {selectedChart && <ChartScreen chart={selectedChart} onClose={() => setSelectedChart(null)} />}
        </AnimatePresence>
        */}
      </main>
    </div>
  )
}

