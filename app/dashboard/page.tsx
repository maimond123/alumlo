"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import NetworkVisualization from "../../components/network-visualization-2"
import Sidebar from "../../components/Sidebar"
import { useSidebar } from "../../components/SidebarProvider"
import { supabase } from "../data/supabase"
import { useSchool } from "../contexts/SchoolContext"

const suggestionTags = [
  "Working on AI at FAANG",
  "People who started companies in Web3",
  "Recent graduates in Silicon Valley",
  "Alumni in Healthcare Tech",
]

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { tableId, schoolName } = useSchool()
  const [schoolData, setSchoolData] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const { isSidebarOpen } = useSidebar()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Debug logs
        console.log("TableId:", tableId)
        console.log("SchoolName:", schoolName)

        if (!tableId) {
          console.log("No tableId available")
          setError("School information not found")
          return
        }

        const { data, error: supabaseError } = await supabase
          .from(`${tableId}_data`)
          .select('*')

        if (supabaseError) {
          console.error("Supabase error:", supabaseError)
          throw supabaseError
        }

        console.log("Fetched data:", data)
        setSchoolData(data || [])

      } catch (err) {
        console.error("Error in fetchData:", err)
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [tableId])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Searching for:", searchQuery)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar />
      <main className={`flex-1 relative transition-all duration-300 ease-in-out ${isSidebarOpen ? "ml-72" : "ml-24"}`}>
        {/* Main Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
            Explore {schoolName} Alumni Data
          </h1>

          <form onSubmit={handleSearch} className="w-full max-w-2xl mb-6">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Who are the alumni working in artificial intelligence at Google?"
                className="w-full px-6 py-4 pr-12 text-lg text-gray-900 placeholder-gray-400 bg-white border-2 border-gray-200 rounded-full focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 shadow-lg"
              />
              <button
                type="submit"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-emerald-500 transition-colors"
              >
                <Search className="w-6 h-6" />
              </button>
            </div>
          </form>

          <div className="flex flex-wrap gap-3 justify-center">
            {suggestionTags.map((tag, index) => (
              <button
                key={index}
                className="px-4 py-2 bg-white/90 hover:bg-white rounded-full text-gray-700 text-sm transition-colors shadow-md"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

