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
      max="2025"
      className="w-24 px-3 py-2 bg-white border border-black rounded-lg focus:outline-none focus:border-[#1c3d4c] text-gray-900 placeholder-gray-400"
    />
  )
}

export default function DataInsightsPage() {
  const { isSidebarOpen } = useSidebar()
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromSignin = searchParams.get("fromSignin") === "true"
  
  // Get the school name from context
  const { schoolName: contextSchoolName, setSchoolName: setContextSchoolName } = useSchool()
  
  // TEMPORARY: Override school name to always be 'lawrenceville'
  const [schoolName, setSchoolName] = useState<string>("lawrenceville")
  
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SchoolChartData[]>([])
  const [charts, setCharts] = useState<SchoolChartData[]>([])
  const [selectedChart, setSelectedChart] = useState<SchoolChartData | null>(null)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [selectedYear, setSelectedYear] = useState("2018")
  const [expandedYear, setExpandedYear] = useState(selectedYear)
  const [salaryData, setSalaryData] = useState<any>(null)
  const [industryData, setIndustryData] = useState<any>(null)
  const [locationData, setLocationData] = useState<Array<{ name: string; value: number }>>([])
  const [graduateSchoolData, setGraduateSchoolData] = useState<any>(null)
  const [industrySalaryData, setIndustrySalaryData] = useState<Array<{ name: string; value: number }>>([])
  const [industryProgressionData, setIndustryProgressionData] = useState<any[]>([])
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({})
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: 'What would you like to know about this data? ' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  // Add state for demo mode
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [showDemoSurvey, setShowDemoSurvey] = useState(false)
  // Add state for the one-time prompt modal
  const [showPromptModal, setShowPromptModal] = useState(false)
  const [promptModalShown, setPromptModalShown] = useState(false)

  // Define the five specific charts we want to show (added industry salary chart)
  const schoolCharts: SchoolChartData[] = [
    { id: "salary", title: "Salary Distribution", type: "salary" },
    { id: "industry", title: "Industry Sectors", type: "industry" },
    { id: "location", title: "Geographic Distribution", type: "location" },
    { id: "graduate_school", title: "Graduate School Distribution", type: "graduate_school" },
    { id: "industry_salary", title: "Average Salary by Industry", type: "industry_salary" },
    // { id: "industry_progression", title: "Industry Progression Over Time", type: "industry_progression" },
  ]

  // Check localStorage when component mounts to see if user has already seen the modal
  useEffect(() => {
    // Check if running in browser environment (not during SSR)
    if (typeof window !== 'undefined') {
      const hasSeenModal = localStorage.getItem('hasSeenAnalyticsPrompt') === 'true';
      if (hasSeenModal) {
        setPromptModalShown(true);
      }
    }
  }, []);

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

        // Check if this is a demo user
        if (userEmail === "maimondavid553@gmail.com") {
          setIsDemoMode(true);
        }

        if (userEmail) {
          const { data, error } = await supabase
            .from("customer_information")
            .select("first_name, last_name")
            .eq("school_email", userEmail)
            .single()

          if (error) {
            setDebugInfo((prev: Record<string, any>) => ({ ...prev, userInfoError: error }))
            return
          }

          if (data) {
            setUserInfo(data)
            setDebugInfo((prev: Record<string, any>) => ({ ...prev, userInfo: data }))
          }
        }

        // Set the charts to our predefined school charts
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

  // Override the school name when the component mounts
  useEffect(() => {
    // TEMPORARY: Force school name to be 'lawrenceville'
    setSchoolName("lawrenceville")
    
    console.log("DEBUG: School name temporarily set to 'lawrenceville'")
  }, [])

  // Modify the existing useEffect that depends on schoolName
  useEffect(() => {
    console.log("DEBUG: schoolName changed:", {
      schoolName,
      schoolNameType: typeof schoolName,
      timestamp: new Date().toISOString(),
      isHardcoded: schoolName === "lawrenceville" ? "yes (temporary override)" : "no"
    })

    // Force a data fetch when schoolName becomes available
    if (schoolName) {
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

  // Add this effect to trigger data loading when the component mounts
  useEffect(() => {
    const loadInitialData = async () => {
      // Wait a short moment to ensure all context providers are initialized
      setTimeout(async () => {
        if (schoolName && selectedYear) {
          console.log("DEBUG: Initial data load triggered");
          await fetchSchoolData();
        } else {
          console.log("DEBUG: Waiting for schoolName and selectedYear before initial load", {
            schoolName,
            selectedYear
          });
        }
      }, 500);
    };
    
    loadInitialData();
  }, []); // Empty dependency array means this runs once on mount

  // Generate dummy data for Chick-fil-A demo user
  const generateChickFilADummyData = (year: string) => {
    const yearNum = parseInt(year)
    
    // Calculate how many people left each year (total 1,371 over 15 years: 2010-2024)
    // More people leave in recent years due to company growth
    const yearDistribution: { [key: number]: number } = {
      2010: 45, 2011: 52, 2012: 58, 2013: 65, 2014: 72,
      2015: 78, 2016: 85, 2017: 92, 2018: 98, 2019: 105,
      2020: 112, 2021: 118, 2022: 125, 2023: 132, 2024: 134
    }
    
    const totalForYear = yearDistribution[yearNum] || 91 // Default average
    
    // Calculate years since graduation (assuming they graduated and immediately started working)
    const yearsExperience = Math.max(0, 2024 - yearNum)
    
    // 1. IMPROVED SALARY DISTRIBUTION - right-skewed bell curve
    // Starting salaries around 35-45k, growing to 55-75k with experience
    const baseSalary = 35000 + (yearsExperience * 3200) // ~3.2k increase per year
    
    const salaryRanges = [
      { min: 20000, max: 30000, label: "$20K-$30K" },
      { min: 30000, max: 40000, label: "$30K-$40K" },
      { min: 40000, max: 50000, label: "$40K-$50K" },
      { min: 50000, max: 60000, label: "$50K-$60K" },
      { min: 60000, max: 70000, label: "$60K-$70K" },
      { min: 70000, max: 80000, label: "$70K-$80K" },
      { min: 80000, max: 90000, label: "$80K-$90K" },
      { min: 90000, max: 200000, label: "$90K+" }
    ]
    
    // Create dramatically different distributions based on experience
    let salaryDistributionWeights: number[];
    
    if (yearsExperience <= 1) {
      // Fresh graduates - heavily skewed toward lower salaries
      salaryDistributionWeights = [0.05, 0.35, 0.35, 0.15, 0.07, 0.02, 0.01, 0.00]
    } else if (yearsExperience <= 3) {
      // Early career - still concentrated in lower-mid range
      salaryDistributionWeights = [0.02, 0.25, 0.40, 0.20, 0.08, 0.03, 0.01, 0.01]
    } else if (yearsExperience <= 6) {
      // Mid-early career - shifting toward middle ranges
      salaryDistributionWeights = [0.01, 0.12, 0.30, 0.30, 0.15, 0.07, 0.03, 0.02]
    } else if (yearsExperience <= 10) {
      // Mid career - more balanced but still right-skewed
      salaryDistributionWeights = [0.01, 0.08, 0.20, 0.28, 0.22, 0.12, 0.06, 0.03]
    } else if (yearsExperience <= 15) {
      // Experienced - significant shift toward higher salaries
      salaryDistributionWeights = [0.00, 0.03, 0.12, 0.22, 0.25, 0.20, 0.12, 0.06]
    } else {
      // Very experienced - heavy concentration in higher ranges
      salaryDistributionWeights = [0.00, 0.02, 0.08, 0.15, 0.22, 0.25, 0.18, 0.10]
    }
    
    // Add year-specific variation to make distributions change between years
    const yearFactor = (yearNum - 2010) / 14 // 0 to 1 progression from 2010 to 2024
    const economicCycle = Math.sin((yearNum - 2010) * 0.7) * 0.15 // Economic ups and downs
    
    // Apply year-based adjustments
    const adjustedWeights = salaryDistributionWeights.map((weight, index) => {
      let adjustedWeight = weight;
      
      // Economic growth over time - gradual shift toward higher salaries
      if (index >= 4) { // Higher salary ranges
        adjustedWeight += yearFactor * 0.1 * weight
      } else { // Lower salary ranges
        adjustedWeight -= yearFactor * 0.05 * weight
      }
      
      // Economic cycles - affects all ranges
      adjustedWeight += economicCycle * weight * 0.3
      
      // Industry-specific year effects (simulating market conditions)
      const industryGrowth = Math.cos((yearNum - 2012) * 0.9) * 0.08
      if (index >= 3 && index <= 6) { // Mid-range salaries most affected
        adjustedWeight += industryGrowth * weight
      }
      
      return Math.max(0.001, adjustedWeight) // Ensure no negative weights
    })
    
    // Normalize weights to sum to 1
    const totalWeight = adjustedWeights.reduce((sum, weight) => sum + weight, 0)
    const normalizedWeights = adjustedWeights.map(weight => weight / totalWeight)
    
    // Apply weights to create the salary distribution
    const salaryData = salaryRanges.map((range, index) => {
      const count = Math.round(totalForYear * normalizedWeights[index])
      return {
        name: range.label,
        value: Math.max(1, count) // Ensure at least 1 person in each non-zero range
      }
    }).filter(item => item.value > 1) // Remove ranges with only 1 person for cleaner display
    
    // Final adjustment to ensure total matches
    const currentTotal = salaryData.reduce((sum, item) => sum + item.value, 0)
    if (currentTotal !== totalForYear && salaryData.length > 0) {
      const difference = totalForYear - currentTotal
      // Add/subtract from the most populated range (usually the modal range)
      const maxIndex = salaryData.reduce((maxIdx, item, idx) => 
        item.value > salaryData[maxIdx].value ? idx : maxIdx, 0)
      salaryData[maxIndex].value = Math.max(1, salaryData[maxIndex].value + difference)
    }
    
    // 2. INDUSTRY DISTRIBUTION - more dramatic changes over time
    const industryEvolution = {
      // Early career (0-2 years) - mostly hospitality/retail
      early: {
        "Hospitality & Food Service": 42,
        "Retail Management": 28,
        "Healthcare": 6,
        "Business & Finance": 4,
        "Education": 3,
        "Technology": 2,
        "Other": 15
      },
      // Mid career (3-7 years) - major diversification
      mid: {
        "Hospitality & Food Service": 18,
        "Retail Management": 16,
        "Healthcare": 20,
        "Business & Finance": 22,
        "Education": 12,
        "Technology": 7,
        "Other": 5
      },
      // Late career (8+ years) - specialized professional roles
      late: {
        "Hospitality & Food Service": 8,
        "Retail Management": 12,
        "Healthcare": 25,
        "Business & Finance": 35,
        "Education": 15,
        "Technology": 4,
        "Other": 1
      }
    }
    
    let industryPercentages: { [key: string]: number };
    if (yearsExperience <= 2) {
      industryPercentages = industryEvolution.early
    } else if (yearsExperience <= 7) {
      // Smooth transition between early and mid
      const transitionFactor = (yearsExperience - 2) / 5
      industryPercentages = {}
      Object.keys(industryEvolution.early).forEach(industry => {
        const earlyValue = (industryEvolution.early as { [key: string]: number })[industry] || 0
        const midValue = (industryEvolution.mid as { [key: string]: number })[industry] || 0
        industryPercentages[industry] = Math.round(earlyValue + (midValue - earlyValue) * transitionFactor)
      })
    } else {
      // Transition from mid to late career
      const transitionFactor = Math.min(1, (yearsExperience - 7) / 8)
      industryPercentages = {}
      Object.keys(industryEvolution.mid).forEach(industry => {
        const midValue = (industryEvolution.mid as { [key: string]: number })[industry] || 0
        const lateValue = (industryEvolution.late as { [key: string]: number })[industry] || 0
        industryPercentages[industry] = Math.round(midValue + (lateValue - midValue) * transitionFactor)
      })
    }
    
    const industryData = Object.entries(industryPercentages).map(([name, percentage]) => ({
      name,
      value: percentage
    }))
    
    // 3. LOCATION DISTRIBUTION - more dramatic migration patterns
    const locationEvolution = {
      // Early career - heavily concentrated in NJ/NY
      early: {
        "Newark, NJ": 28, "Jersey City, NJ": 22, "Trenton, NJ": 15,
        "New York, NY": 8, "Paterson, NJ": 10, "Elizabeth, NJ": 8,
        "Camden, NJ": 5, "Philadelphia, PA": 2, "Bridgeport, CT": 1,
        "Boston, MA": 1
      },
      // Mid career - significant movement to bigger cities
      mid: {
        "New York, NY": 25, "Newark, NJ": 12, "Jersey City, NJ": 10,
        "Philadelphia, PA": 15, "Boston, MA": 12, "Trenton, NJ": 6,
        "Washington, DC": 8, "Baltimore, MD": 4, "Paterson, NJ": 3,
        "Elizabeth, NJ": 2, "Atlanta, GA": 2, "Bridgeport, CT": 1
      },
      // Late career - national distribution
      late: {
        "New York, NY": 22, "Boston, MA": 18, "Philadelphia, PA": 14,
        "Washington, DC": 15, "Atlanta, GA": 10, "Newark, NJ": 5,
        "Baltimore, MD": 8, "Jersey City, NJ": 3, "Richmond, VA": 3,
        "Trenton, NJ": 2
      }
    }
    
    let locationPercentages: { [key: string]: number };
    if (yearsExperience <= 2) {
      locationPercentages = locationEvolution.early
    } else if (yearsExperience <= 7) {
      locationPercentages = locationEvolution.mid
    } else {
      locationPercentages = locationEvolution.late
    }
    
    const locationData = Object.entries(locationPercentages).map(([name, percentage]) => ({
      name,
      value: Math.round(totalForYear * percentage / 100)
    })).filter(item => item.value > 0).slice(0, 10)
    
    // 4. GRADUATE SCHOOL DISTRIBUTION - more dramatic changes
    const gradSchoolBase = {
      "No Graduate School": Math.max(60, 90 - (yearsExperience * 2.5)), // Decreases more dramatically
      "Master's Degree": Math.min(30, 5 + (yearsExperience * 2.0)), // Increases significantly
      "Doctoral Degree": Math.min(7, 1 + (yearsExperience * 0.4)), // Modest increase
      "Professional Degree": Math.min(6, 2 + (yearsExperience * 0.3)) // Modest increase
    }
    
    // Normalize graduate school percentages
    const gradTotal = Object.values(gradSchoolBase).reduce((sum, val) => sum + val, 0)
    const gradSchoolData = Object.entries(gradSchoolBase).map(([name, percentage]) => ({
      name,
      value: Math.round((percentage / gradTotal) * 100)
    }))
    
    // 5. IMPROVED AVERAGE SALARY BY INDUSTRY - less uniform with realistic variations
    const baseSalaries: { [key: string]: number } = {
      "Technology": 62000,
      "Business & Finance": 54000,
      "Healthcare": 48000,
      "Hospitality & Food Service": 36000,
      "Retail Management": 41000,
      "Education": 38000,
      "Other": 43000
    }
    
    const industrySalaryData = Object.entries(baseSalaries).map(([industry, baseSal]) => {
      // More varied growth rates by industry
      const growthRates: { [key: string]: number } = {
        "Technology": 3800, // Fastest growth
        "Business & Finance": 3200, // Good growth
        "Healthcare": 2800, // Steady growth
        "Education": 1800, // Slower growth
        "Hospitality & Food Service": 2200, // Moderate growth
        "Retail Management": 2400, // Moderate growth
        "Other": 2600 // Average growth
      }
      
      const growthRate = growthRates[industry] || 2600
      const experienceBonus = yearsExperience * growthRate
      
      // Add some year-specific variation and industry-specific volatility
      const yearVariation = Math.sin((yearNum - 2010) * 0.8) * (baseSal * 0.08) // 8% variation
      const industryVolatility = (Math.random() - 0.5) * (baseSal * 0.12) // 12% random variation
      
      const finalSalary = baseSal + experienceBonus + yearVariation + industryVolatility
      
      return {
        name: industry,
        value: Math.round(Math.max(25000, finalSalary)) // Minimum salary floor
      }
    }).sort((a, b) => b.value - a.value)
    
    // Set all the calculated data
    setSalaryData(salaryData)
    setIndustryData(industryData)
    setLocationData(locationData)
    setGraduateSchoolData(gradSchoolData)
    setIndustrySalaryData(industrySalaryData)
    
    // Enhanced industry progression data with more variation
    const progressionYears = [1, 3, 5].filter(y => y <= yearsExperience + 1)
    const sampleProgressionData = progressionYears.map(yearsAfter => {
      const adjustedYear = yearsAfter + (2024 - yearNum)
      const experience = Math.min(adjustedYear, 15)
      
      // Calculate industry distribution for this experience level with more variation
      let progressionPercentages;
      if (experience <= 2) {
        progressionPercentages = industryEvolution.early
      } else if (experience <= 7) {
        progressionPercentages = industryEvolution.mid
      } else {
        progressionPercentages = industryEvolution.late
      }
      
      const industries: { [key: string]: { count: number } } = {}
      Object.entries(progressionPercentages).forEach(([industry, percentage]) => {
        // Add some random variation to make progression more interesting
        const variation = (Math.random() - 0.5) * 0.3 // ±15% variation
        const adjustedPercentage = Math.max(0, percentage * (1 + variation))
        industries[industry] = { count: Math.round(totalForYear * adjustedPercentage / 100) }
      })
      
      return {
        industries,
        years_after: yearsAfter
      }
    })
    
    setIndustryProgressionData(sampleProgressionData)
    
    console.log("DEBUG: Enhanced Chick-fil-A dummy data generated for year", year, {
      totalForYear,
      yearsExperience,
      salaryRange: `${Math.min(...salaryData.map(s => parseInt(s.name.split('-')[0].replace(/\D/g, ''))))}k - ${Math.max(...salaryData.map(s => parseInt(s.name.split('-')[1]?.replace(/\D/g, '') || '90')))}k+`,
      topIndustries: industryData.slice(0, 3).map(i => `${i.name}: ${i.value}%`),
      topLocations: locationData.slice(0, 3).map(l => l.name),
      avgSalaryByTopIndustry: industrySalaryData.slice(0, 3).map(i => `${i.name}: $${i.value.toLocaleString()}`)
    })
  }

  // Modify the beginning of fetchSchoolData to add more diagnostics
  const fetchSchoolData = async () => {
    console.log("DEBUG: fetchSchoolData called with:", {
      schoolName,
      selectedYear,
      timestamp: new Date().toISOString(),
      isHardcoded: schoolName === "lawrenceville" ? "yes (temporary override)" : "no"
    })

    if (!schoolName) {
      console.error("DEBUG: No school name available, cannot fetch data")
      setDebugInfo((prev: Record<string, any>) => ({ ...prev, fetchError: "No school name available" }))
      return
    }

    try {
      // Check if this is the Chick-fil-A demo user and generate dummy data
      const userEmail = await getUserEmail()
      console.log("DEBUG: User email retrieved:", userEmail)
      console.log("DEBUG: Email type:", typeof userEmail)
      console.log("DEBUG: Email === 'davod@alumintel.co':", userEmail === "davod@alumintel.co")
      
      if (userEmail === "davod@alumintel.co" || true) {
        console.log("DEBUG: ✅ CHICK-FIL-A USER DETECTED - Generating dummy data for year:", selectedYear)
        generateChickFilADummyData(selectedYear)
        return
      } else {
        console.log("DEBUG: ❌ Not Chick-fil-A user, proceeding with database fetch")
      }

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
        if (salaryData && salaryData!.length > 0 && salaryData![0]?.current_salary_distribution) {
          console.log("DEBUG: Raw salary data:", salaryData![0].current_salary_distribution);
          
          // Transform the object format into the array format expected by BarChart
          const chartData = Object.entries(salaryData![0].current_salary_distribution)
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
        if (industryData && industryData!.length > 0 && industryData![0]?.current_industry_distribution) {
          console.log("DEBUG: Setting industry data:", industryData![0].current_industry_distribution)
          const formattedData = Object.entries(industryData![0].current_industry_distribution)
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
        if (locationData && locationData!.length > 0 && locationData![0]?.current_job_location_distribution) {
          console.log("DEBUG: Raw current_job_location_distribution object:", 
            JSON.stringify(locationData![0].current_job_location_distribution, null, 2));
          
          // Log each location entry individually for clarity
          console.log("DEBUG: Location entries (name: count):");
          Object.entries(locationData![0].current_job_location_distribution).forEach(([location, count]) => {
            console.log(`  "${location}": ${count}`);
          });
        }
        
        setDebugInfo((prev: Record<string, any>) => ({ ...prev, locationData }))
        if (locationData && locationData!.length > 0) {
          console.log("DEBUG: Processing location data...")
          // Process location data
          const locationCounts: { [key: string]: number } = {}

          if (locationData![0]?.current_job_location_distribution) {
            Object.entries(locationData![0].current_job_location_distribution).forEach(([city, count]) => {
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
        if (gradSchoolData && gradSchoolData!.length > 0 && gradSchoolData![0]?.graduate_school_distribution) {
          console.log("DEBUG: Setting graduate school data:", gradSchoolData![0].graduate_school_distribution)
          const formattedData = Object.entries(gradSchoolData![0].graduate_school_distribution)
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
        if (industrySalaryData && industrySalaryData!.length > 0 && industrySalaryData![0]?.average_salary_by_industry_distribution) {
          console.log("DEBUG: Raw industry salary data:", industrySalaryData![0].average_salary_by_industry_distribution);
          
          // Transform the object format into the array format expected by BarChart
          const chartData = Object.entries(industrySalaryData![0].average_salary_by_industry_distribution)
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

      // Fetch industry progression data
      console.log("DEBUG: Fetching industry progression data...")
      const { data: industryProgressionData, error: industryProgressionError } = await supabase
        .from(tableName)
        .select("career_progression_distribution, class_year")
        .eq("class_year", selectedYear)
      
      if (industryProgressionError) {
        console.error("Error fetching industry progression data:", industryProgressionError)
        setDebugInfo((prev: Record<string, any>) => ({ ...prev, industryProgressionError }))
      } else {
        console.log("DEBUG: Industry progression data response:", industryProgressionData)
        setDebugInfo((prev: Record<string, any>) => ({ ...prev, industryProgressionData }))
        if (industryProgressionData && industryProgressionData!.length > 0 && industryProgressionData![0]?.career_progression_distribution) {
          console.log("DEBUG: Raw industry progression data:", industryProgressionData![0].career_progression_distribution);
          setIndustryProgressionData(industryProgressionData![0].career_progression_distribution);
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
    // Use a consistent height for all chart containers to prevent layout shifts
    const chartContainerStyle = { 
      width: '100%', 
      height: '100%',
      minHeight: '300px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    };
    
    // Loading placeholder with consistent dimensions
    const loadingPlaceholder = (
      <div style={chartContainerStyle} className="bg-gray-50 rounded-lg animate-pulse">
        <div className="text-gray-400">Loading chart data...</div>
      </div>
    );
    
    switch (chart.type) {
      case "salary":
        return salaryData && Array.isArray(salaryData) ? (
          <div style={chartContainerStyle}>
            <SalaryBarChart data={salaryData} isZoomed={selectedChart?.id === chart.id} />
          </div>
        ) : loadingPlaceholder;
        
      case "industry":
        return industryData ? (
          <div style={chartContainerStyle}>
            <PieChart data={industryData} isZoomed={selectedChart?.id === chart.id} />
          </div>
        ) : loadingPlaceholder;
        
      case "location":
        return locationData && Array.isArray(locationData) && locationData.length > 0 ? (
          <div style={chartContainerStyle}>
            <GeographyBarChart data={locationData} isZoomed={selectedChart?.id === chart.id} />
          </div>
        ) : loadingPlaceholder;
        
      case "graduate_school":
        return graduateSchoolData ? (
          <div style={chartContainerStyle}>
            <PieChart data={graduateSchoolData} isZoomed={selectedChart?.id === chart.id} />
          </div>
        ) : loadingPlaceholder;
        
      case "industry_salary":
        return industrySalaryData && Array.isArray(industrySalaryData) && industrySalaryData.length > 0 ? (
          <div style={chartContainerStyle}>
            <AverageSalaryByIndustryBarChart data={industrySalaryData} isZoomed={selectedChart?.id === chart.id} />
          </div>
        ) : loadingPlaceholder;
        
      case "industry_progression":
        return industryProgressionData && industryProgressionData.length > 0 ? (
          <div style={chartContainerStyle}>
            <IndustryStackedBarChart data={industryProgressionData} isZoomed={selectedChart?.id === chart.id} />
          </div>
        ) : loadingPlaceholder;
        
      default:
        return (
          <div style={chartContainerStyle} className="bg-gray-100 rounded-lg">
            <div className="text-gray-500">Unsupported chart type</div>
          </div>
        );
    }
  };

  const handleWidgetClick = (chart: SchoolChartData) => {
    console.log("DEBUG: Chart clicked:", chart)
    
    // Set expanded year to match the current selected year
    setExpandedYear(selectedYear)
    
    // Ensure data is loaded for this chart type before expanding
    const isDataLoaded = (() => {
      switch (chart.type) {
        case "salary":
          return salaryData && Array.isArray(salaryData);
        case "industry":
          return !!industryData;
        case "location":
          return locationData && Array.isArray(locationData) && locationData.length > 0;
        case "graduate_school":
          return !!graduateSchoolData;
        case "industry_salary":
          return industrySalaryData && Array.isArray(industrySalaryData) && industrySalaryData.length > 0;
        case "industry_progression":
          return industryProgressionData && industryProgressionData.length > 0;
        default:
          return false;
      }
    })();
    
    // If data is already loaded, expand immediately
    // Otherwise, trigger a data fetch first
    if (isDataLoaded) {
      setSelectedChart(chart);
    } else {
      // Show a loading state
      console.log("DEBUG: Data not loaded yet, fetching first...");
      
      // Set a temporary loading state if needed
      // You could add a loading indicator here
      
      // Fetch data then expand
      fetchSchoolData().then(() => {
        setSelectedChart(chart);
      });
    }
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
      <AnimatePresence mode="wait">
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-md z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => setSelectedChart(null)}
        >
          <motion.div
            className="bg-white rounded-xl overflow-hidden w-full max-w-[1400px] h-[80vh] flex flex-col relative"
            layoutId={`chart-${selectedChart.id}`}
            onClick={(e) => e.stopPropagation()}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              layout: { duration: 0.4 }
            }}
          >
            <div className="flex h-full w-full overflow-hidden">
              {/* Left side - Chart visualization */}
              <motion.div 
                className="flex flex-col overflow-hidden"
                animate={{ 
                  width: isChatExpanded ? "0%" : "66.666667%",
                  opacity: isChatExpanded ? 0 : 1,
                  padding: isChatExpanded ? "0px" : "2rem"
                }}
                initial={false}
                style={{
                  display: isChatExpanded ? "none" : "flex"
                }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 30,
                  opacity: { duration: 0.2 }
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
                      className="px-4 py-2 bg-black text-white rounded-lg hover:scale-105 transform transition-transform duration-300"
                    >
                      Update Year
                    </button>
                  </div>
                </div>

                <motion.div 
                  layoutId={`chart-content-${selectedChart.id}`} 
                  className="flex-1 flex items-center justify-center overflow-hidden"
                  initial={false}
                >
                  <div className="w-full" style={{ height: "75%" }}>
                    {renderChart(selectedChart)}
                  </div>
                </motion.div>
              </motion.div>

              {/* Chat sidebar */}
              <motion.div
                className="border-l border-gray-200 flex flex-col bg-gray-50 relative"
                animate={{ 
                  width: isChatExpanded ? "100%" : "33.333333%" 
                }}
                initial={false}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 30
                }}
              >
                {/* Toggle button with thick black border */}
                <button 
                  onClick={() => setIsChatExpanded(!isChatExpanded)} 
                  className={`absolute top-1/2 -translate-y-1/2 bg-white rounded-full p-1.5 shadow-md border border-black z-10 hover:bg-gray-50 transition-all duration-300 hover:scale-110 ${
                    isChatExpanded ? "left-4" : "-left-4"
                  }`}
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

                {/* Chat content */}
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

  // Add this effect to reset chat expanded state when a chart is selected
  useEffect(() => {
    if (selectedChart) {
      // Reset to visualization mode (chat collapsed) whenever a chart is selected
      setIsChatExpanded(false);
      
      // Also reset chat messages as you were doing before
      setChatMessages([
        { role: 'assistant', content: 'What would you like to know about this data?' }
      ]);
    }
  }, [selectedChart]); // This effect runs whenever selectedChart changes

  // Add effect to show the prompt modal after a few seconds for demo users
  useEffect(() => {
    if (isDemoMode && !promptModalShown && !isLoading) {
      // Check if the user has already seen the modal
      const hasSeenModal = localStorage.getItem('hasSeenAnalyticsPrompt') === 'true';
      
      if (!hasSeenModal) {
        const timer = setTimeout(() => {
          setShowPromptModal(true);
          setPromptModalShown(true);
        }, 3000); // Show after 3 seconds
        
        return () => clearTimeout(timer);
      } else {
        // Mark as shown in component state to prevent any future checks
        setPromptModalShown(true);
      }
    }
  }, [isDemoMode, promptModalShown, isLoading]);

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

          {/* Add clear instruction message for using the charts */}
          <div className="mb-8 p-4 bg-emerald-50 border border-emerald-200 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold text-emerald-800 mb-2">Interactive Alumni Analytics</h2>
            <p className="text-gray-700">
              Click on any chart below to expand it and chat with our AI assistant about the data. 
              Ask questions like "What trends do you see?" or "What insights can you provide about this industry data?"
            </p>
          </div>

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
                  } relative`}
                  transition={{ duration: 0.3 }}
                >
                  {/* Clickable indicator badge */}
                  <div className="absolute -top-2 -right-2 bg-emerald-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Click to Explore & Chat
                  </div>

                  <div className="flex justify-between items-start mb-4">
                    <motion.h3 layoutId={`title-${chart.id}`} className="text-lg font-medium text-gray-900">
                      {chart.title}
                    </motion.h3>
                  </div>
                  <motion.div layoutId={`chart-content-${chart.id}`} className="flex-1 w-full relative">
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
      
      {/* Demo Survey Modal */}
      {isDemoMode && showDemoSurvey && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            // Close the modal when clicking the backdrop (outside the modal)
            if (e.target === e.currentTarget) {
              setShowDemoSurvey(false);
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 w-full text-center">your School's Alumni Data?</h2>
              <button 
                onClick={() => setShowDemoSurvey(false)}
                className="text-gray-500 hover:text-gray-700 absolute right-6 top-6"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form className="space-y-6" onSubmit={async (e) => {
              e.preventDefault();
              
              // Get form data
              const formData = new FormData(e.currentTarget);
              const schoolName = formData.get('school-name') as string;
              const email = formData.get('email') as string;
              const features = Array.from(formData.getAll('features')) as string[];
              const budget = formData.get('budget') as string;
              
              try {
                // Save to Supabase
                const { error } = await supabase
                  .from('demo_survey_responses')
                  .insert([{ 
                    school_name: schoolName,
                    email: email,
                    features: features,
                    created_at: new Date().toISOString()
                  }]);
                  
                if (error) throw error;
                
                // Show confirmation message
                setShowDemoSurvey(false);
                
                // Show confirmation modal
                alert("Thank you for your interest! We'll contact you within 24 hours with more information about how AlumIntel can work for your institution.");
                
              } catch (error) {
                console.error('Error submitting survey:', error);
                alert('There was an error submitting your information. Please try again.');
              }
            }}>
              <div>
                <label htmlFor="school-name" className="block text-sm font-medium text-gray-700 mb-1">
                  What's your school's name?
                </label>
                <input
                  type="text"
                  id="school-name"
                  name="school-name"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g., Westfield High School"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Your work email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="name@work.edu"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Which features would be most valuable to your institution?
                </label>
                <div className="space-y-2">
                  {[
                    "Alumni Search and Discovery",
                    "Aggregate Alumni Analytics",
                    "Customizable School Insights Report",
                    "Student Mentorship Connections",
                    "Fundraising Insights",
                    "New Alumni Database",
                    "Networking Opportunities"
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`feature-${index}`}
                        name="features"
                        value={feature}
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`feature-${index}`} className="ml-2 text-gray-700">
                        {feature}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-emerald-600 text-white py-3 px-4 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
                >
                  Submit & Continue Exploring
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* One-time Prompt Modal for Demo Users */}
      {isDemoMode && showPromptModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowPromptModal(false);
            // Save to localStorage that user has seen the modal
            localStorage.setItem('hasSeenAnalyticsPrompt', 'true');
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Interactive Analytics</h2>
              <p className="text-gray-600 mb-6">
                Click on any visualization to explore the data in detail and chat with our AI assistant about what you're seeing.
              </p>
              <button
                onClick={() => {
                  setShowPromptModal(false);
                  // Save to localStorage that user has seen the modal
                  localStorage.setItem('hasSeenAnalyticsPrompt', 'true');
                }}
                className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

