"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import NetworkVisualization from "../../components/network-visualization-2"
import Sidebar from "../../components/Sidebar"
import { useSidebar } from "../../components/SidebarProvider"
import { supabase } from "../data/supabase"
import '../aws-config'  
import { getUserEmail } from "../utils/auth"
import { useRouter } from "next/navigation"
import { Amplify } from 'aws-amplify'
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth'

// Add the new interface for search results
interface SearchResult {
  id: number;
  name: string;
  linkedin_url: string;
  current_company: string;
  current_title: string;
  current_industry: string;
  location: string;
  years_experience: number;
  similarity: number;
}

const suggestionTags = [
  "Working on AI at FAANG",
  "People who started companies in Web3",
  "Recent graduates in Silicon Valley",
  "Alumni in Healthcare Tech",
]

export default function DashboardPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formattedSchoolName, setFormattedSchoolName] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const { isSidebarOpen } = useSidebar()
  
  
  // Add new states for search functionality
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const [authState, setAuthState] = useState({
    isLoading: true,
    isAuthenticated: false,
    authError: null as unknown | null,
    userEmail: null as string | null
  })

  useEffect(() => {
    const checkAuthStatus = async () => {
      console.log("Dashboard: Checking auth status...")
      try {
        const { username, userId, signInDetails } = await getCurrentUser()
        const session = await fetchAuthSession()
        console.log("Dashboard: User authenticated:", username)
        console.log("Dashboard: Session:", session)
        
        setAuthState({
          isLoading: false,
          isAuthenticated: true,
          authError: null,
          userEmail: signInDetails?.loginId || null
        })
      } catch (error) {
        console.error("Dashboard: Auth error:", error)
        setAuthState({
          isLoading: false,
          isAuthenticated: false,
          authError: error,
          userEmail: null
        })
      }
    }

    checkAuthStatus()
  }, [])

  useEffect(() => {
    if (authState.isAuthenticated) {
      console.log("Dashboard: User authenticated, fetching data...")
      const fetchSchoolName = async () => {
        try {
          const userEmail = await getUserEmail()

          if (!userEmail) {
            console.error('No email found in user data:', userEmail)
            throw new Error('No user email found')
          }

          console.log('Querying with email:', userEmail)
          const { data, error } = await supabase
            .from('customer_information')
            .select('school_name')
            .eq('school_email', userEmail)
            .single()

          if (error) {
            console.error('Supabase query error:', error)
            throw error
          }

          const formatted = data.school_name
            .replace(/_/g, ' ')
            .split(' ')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          setFormattedSchoolName(formatted)
          setIsLoading(false)
        } catch (err: any) {
          console.error('Error fetching school name:', err)
          if (err.message?.includes('not authenticated')) {
            router.push('/login')
            return
          }
          setError('Failed to load school data')
          setIsLoading(false)
        }
      }

      fetchSchoolName()
    }
  }, [authState.isAuthenticated, router])

  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[Client] Search initiated with query:', searchQuery);
    
    setIsSearching(true);
    try {
      console.log('[Client] About to send request to /api/search');
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery, top_k: 10 }),
      });
      
      console.log('[Client] Response received, status:', response.status);
      
      if (!response.ok) {
        console.error('[Client] Error response from server');
        const errorData = await response.json();
        console.error('[Client] Error details:', errorData);
        throw new Error('Search failed');
      }
      
      console.log('[Client] Parsing response JSON');
      const data = await response.json();
      console.log('[Client] Search results:', data);
      
      // Process search results
      const results = data.results;
      setSearchResults(results);
      return results;
    } catch (error) {
      console.error('[Client] Search error:', error);
      throw error;
    } finally {
      setIsSearching(false);
    }
  };
  
  if (authState.isLoading) {
    return <div>Loading authentication status...</div>
  }

  if (!authState.isAuthenticated) {
    return <div>Please log in to access the dashboard. Error: {authState.authError instanceof Error ? authState.authError.message : String(authState.authError)}</div>
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
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
            Explore {formattedSchoolName} Alumni Data
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
                disabled={isSearching}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-emerald-500 transition-colors"
              >
                <Search className="w-6 h-6" />
              </button>
            </div>
          </form>

          <div className="flex flex-wrap gap-3 justify-center mb-8">
            {suggestionTags.map((tag, index) => (
              <button
                key={index}
                onClick={() => setSearchQuery(tag)}
                className="px-4 py-2 bg-white/90 hover:bg-white rounded-full text-gray-700 text-sm transition-colors shadow-md"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Search Results */}
          {isSearching ? (
            <div className="text-center p-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-2"></div>
              <p>Searching alumni database...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="w-full max-w-4xl mt-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">
                Found {searchResults.length} alumni matching your search
              </h2>
              <div className="grid gap-4 overflow-y-auto max-h-[60vh]">
                {searchResults.map((result) => (
                  <a
                    key={result.id}
                    href={result.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 bg-white border rounded-lg hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900">{result.name}</h3>
                        <p className="text-gray-600">{result.current_title} at {result.current_company}</p>
                        <p className="text-gray-500">{result.location}</p>
                        <p className="text-gray-500">Industry: {result.current_industry}</p>
                        {result.years_experience && (
                          <p className="text-gray-500">{result.years_experience} years of experience</p>
                        )}
                        <div className="mt-2 flex items-center">
                          <div className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full">
                            Match: {(result.similarity * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ) : searchQuery.trim() !== "" ? (
            <div className="text-center p-8 bg-white/80 rounded-lg shadow-sm mt-8">
              <p className="text-gray-600">No alumni found matching your search. Try different keywords.</p>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  )
}