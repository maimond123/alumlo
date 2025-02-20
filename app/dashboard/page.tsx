"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import NetworkVisualization from "../../components/network-visualization-2"
import Sidebar from "../../components/Sidebar"
import { useSidebar } from "../../components/SidebarProvider"
import { supabase } from "../data/supabase"

const suggestionTags = [
  "Working on AI at FAANG",
  "People who started companies in Web3",
  "Recent graduates in Silicon Valley",
  "Alumni in Healthcare Tech",
]

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const { isSidebarOpen } = useSidebar()
  const [schoolName, setSchoolName] = useState("")

  useEffect(() => {
    const getSchoolName = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user?.email) {
          const { data, error } = await supabase
            .from('customer_information')
            .select('school_name')
            .eq('school_email', user.email)
            .single()

          if (error) {
            console.error('Error fetching school name:', error)
            return
          }

          if (data?.school_name) {
            // Remove common prefixes like "The" and trim whitespace
            const cleanedName = data.school_name
              .replace(/^The\s+/i, '')
              .trim()
            setSchoolName(cleanedName)
          }
        }
      } catch (error) {
        console.error('Error in getSchoolName:', error)
      }
    }

    getSchoolName()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Searching for:", searchQuery)
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar />
      <main className={`flex-1 relative transition-all duration-300 ease-in-out ${isSidebarOpen ? "ml-72" : "ml-24"}`}>
        {/* Main Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
            Explore your {schoolName} Data
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

