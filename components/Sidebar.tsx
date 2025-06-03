"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { BarChart2, FileText, Search, Upload, Brain, MessageCircle, Settings } from "lucide-react"
import { useSidebar } from "./SidebarProvider"
import { supabase } from "../app/data/supabase"
import type React from "react"
import { getUserEmail, getCurrentUser } from '../app/utils/auth'
import { useRecentActivity } from '../hooks/useRecentActivity'
import { useRouter, usePathname } from 'next/navigation'

interface UserInfo {
  first_name: string;
  last_name: string;
  organization_name: string;
}

export default function Sidebar() {
  const { isSidebarOpen, openSidebar, closeSidebar } = useSidebar()
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  
  // Add recent activity hook
  const { recentActivity, loadRecentActivity, formatActivityTitle, formatActivityTime } = useRecentActivity()
  
  // Add state for page-specific recent items
  const [recentSearches, setRecentSearches] = useState<any[]>([])
  const [recentConversations, setRecentConversations] = useState<any[]>([])
  const [isLoadingRecent, setIsLoadingRecent] = useState(false)
  const [isSpinning, setIsSpinning] = useState(false); // State for gear icon spin

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        // Get user email from Supabase
        const userEmail = await getUserEmail()
        
        if (!userEmail) {
          return
        }
        
        // Get user info from database
        const { data, error } = await supabase
          .from('customer_information')
          .select('first_name, last_name, organization_name')
          .eq('organization_email', userEmail)
          .single()
        
        if (error) {
          return
        }
        
        if (data) {
          setUserInfo({
            first_name: data.first_name,
            last_name: data.last_name,
            organization_name: data.organization_name
          })
        }
      } catch (error) {
        // Silently handle error
      }
    }
    
    getUserInfo()
  }, [])

  // Load page-specific recent data
  const loadRecentSearches = async () => {
    try {
      setIsLoadingRecent(true)
      const userEmail = await getUserEmail()
      if (!userEmail) return

      const { data, error } = await supabase
        .from('search_history')
        .select('id, query, created_at')
        .eq('user_email', userEmail)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error
      setRecentSearches(data || [])
    } catch (error) {
      console.error('Error loading recent searches:', error)
      setRecentSearches([])
    } finally {
      setIsLoadingRecent(false)
    }
  }

  const loadRecentConversations = async () => {
    try {
      setIsLoadingRecent(true)
      const userEmail = await getUserEmail()
      if (!userEmail) return

      const { data, error } = await supabase
        .from('learn_conversations')
        .select('id, title, updated_at')
        .eq('user_email', userEmail)
        .order('updated_at', { ascending: false })
        .limit(10) // Get more initially to allow for deduplication

      if (error) throw error
      
      // Deduplicate by title - keep only the most recent conversation for each unique title
      const uniqueConversations = data?.reduce((acc: any[], current) => {
        const existingIndex = acc.findIndex(item => item.title === current.title)
        if (existingIndex === -1) {
          // Title not found, add to accumulator
          acc.push(current)
        } else {
          // Title exists, keep the one with more recent updated_at
          if (new Date(current.updated_at) > new Date(acc[existingIndex].updated_at)) {
            acc[existingIndex] = current
          }
        }
        return acc
      }, []) || []
      
      // Take only the first 5 unique conversations
      setRecentConversations(uniqueConversations.slice(0, 5))
    } catch (error) {
      console.error('Error loading recent conversations:', error)
      setRecentConversations([])
    } finally {
      setIsLoadingRecent(false)
    }
  }

  // Load page-specific data when sidebar opens and pathname changes
  useEffect(() => {
    if (isSidebarOpen) {
      if (pathname === '/dashboard') {
        loadRecentSearches()
      } else if (pathname === '/learn') {
        loadRecentConversations()
      }
    }
  }, [isSidebarOpen, pathname])

  // Get initials from full name
  const getInitials = () => {
    if (!userInfo) return '??'
    return `${userInfo.first_name[0]}${userInfo.last_name[0]}`.toUpperCase()
  }

  // Get full name
  const getFullName = () => {
    if (!userInfo) return 'Loading...'
    return `${userInfo.first_name} ${userInfo.last_name}`
  }

  // Format time for recent items
  const formatTime = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    return time.toLocaleDateString()
  }

  // Determine what to show in the recent section
  const shouldShowRecentSection = pathname === '/dashboard' || pathname === '/learn'
  const recentSectionTitle = pathname === '/dashboard' ? 'Recent Searches' : 'Recent Chats'
  const recentItems = pathname === '/dashboard' ? recentSearches : recentConversations

  // Function to load a search into the dashboard
  const loadSearchInDashboard = (searchId: string, query: string) => {
    console.log(`[SIDEBAR DEBUG] Loading search: ${searchId} with query: "${query}"`);
    
    // Store the search data in localStorage to be picked up by the dashboard
    localStorage.setItem('loadSearch', JSON.stringify({
      id: searchId,
      query: query,
      timestamp: Date.now()
    }))
    
    // Navigate to dashboard if not already there
    if (pathname !== '/dashboard') {
      console.log(`[SIDEBAR DEBUG] Navigating to dashboard from ${pathname}`);
      router.push('/dashboard')
    } else {
      // If already on dashboard, trigger a custom event to reload the search
      console.log(`[SIDEBAR DEBUG] Already on dashboard, dispatching loadSearch event`);
      window.dispatchEvent(new CustomEvent('loadSearch', {
        detail: { id: searchId, query: query }
      }))
    }
  }

  // Add sign out function
  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("Error signing out:", error)
        // Optionally, show an error message to the user
        return;
      }
      // Redirect to the main website instead of signin page
      window.location.href = 'https://www.alumlo.com'; 
    } catch (error) {
      console.error("Error during sign out process:", error)
      // Optionally, show an error message to the user
    }
  }

  // Function to navigate to settings
  const navigateToSettings = () => {
    router.push('/settings')
  }

  return (
    <motion.div
      className={`fixed top-0 left-2 h-full bg-transparent flex flex-col border-r border-black z-20 overflow-hidden transition-[width] duration-300 ease-in-out`}
      initial={false}
      animate={{ width: isSidebarOpen ? "18rem" : "6rem" }}
      onMouseEnter={openSidebar}
      onMouseLeave={closeSidebar}
    >
      <div className="p-6 flex flex-col h-full w-full">
        {/* Logo Section with more space below */}
        <div
          className="flex items-center mb-16 transition-transform duration-300 ease-in-out"
          style={{ transform: isSidebarOpen ? "translateX(1rem)" : "translateX(0.75rem)" }}
        >
          <Image
            src="/assets/icons8-atom-48.png"
            alt="AlumIntel Logo"
            width={32}
            height={32}
            className="transition-transform duration-300 ease-in-out shrink-0"
          />
          <span
            className={`ml-3 text-black text-2xl font-bold transition-all duration-300 ease-in-out origin-left`}
            style={{ opacity: isSidebarOpen ? 1 : 0, transform: isSidebarOpen ? "scaleX(1)" : "scaleX(0)" }}
          >
            Alumlo
          </span>
        </div>

        {/* Navigation Links with more space between them */}
        <nav>
          <SidebarLink href="/dashboard" icon={Search} isOpen={isSidebarOpen} currentPath={pathname}>
            Search
          </SidebarLink>
          <SidebarLink href="/learn" icon={Brain} isOpen={isSidebarOpen} currentPath={pathname}>
            Learn
          </SidebarLink>
          <SidebarLink href="/data-insights" icon={BarChart2} isOpen={isSidebarOpen} currentPath={pathname}>
            Visualize
          </SidebarLink>
          <SidebarLink href="/upload-data" icon={Upload} isOpen={isSidebarOpen} currentPath={pathname}>
            Enrich Data
          </SidebarLink>
        </nav>

        {/* Recent Section - Positioned close below navigation */}
        {isSidebarOpen && shouldShowRecentSection && (
          <div className="mt-8">
            <div className="px-6 mb-4">
              <h3 className="text-lg font-semibold text-black">{recentSectionTitle}</h3>
            </div>
            <div className="space-y-2 px-6 max-h-64 overflow-y-auto">
              {isLoadingRecent ? (
                <div className="text-gray-500 text-sm py-2">
                  Loading...
                </div>
              ) : recentItems.length > 0 ? (
                recentItems.map((item) => (
                  <RecentItem
                    key={item.id}
                    item={item}
                    type={pathname === '/dashboard' ? 'search' : 'learn'}
                    formatTime={formatTime}
                    onClick={() => {
                      if (pathname === '/dashboard') {
                        // Load the search into the dashboard
                        loadSearchInDashboard(item.id, item.query || '')
                      } else {
                        // For conversations, we could potentially load the conversation
                        // For now, just navigate to learn
                        router.push('/learn')
                      }
                    }}
                  />
                ))
              ) : (
                <div className="text-gray-500 text-sm py-2">
                  {pathname === '/dashboard' ? 'No recent searches' : 'No recent chats'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Spacer to push profile to bottom */}
        <div className="flex-1"></div>

        {/* Profile Section moved to bottom */}
        <div
          className="flex items-center justify-between transition-transform duration-300 ease-in-out w-full"
          style={{ transform: isSidebarOpen ? "translateX(1rem)" : "translateX(0.5rem)" }}
        >
          <div className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full bg-emerald-green/20 border border-emerald-green/30 flex items-center justify-center shrink-0`}
            >
              <span className="text-black font-semibold text-base">{getInitials()}</span>
            </div>
            <div
              className="ml-3 transition-all duration-300 ease-in-out origin-left overflow-hidden"
              style={{ opacity: isSidebarOpen ? 1 : 0, width: isSidebarOpen ? "auto" : 0 }}
            >
              <h3 className="text-black font-medium text-lg whitespace-nowrap">{getFullName()}</h3>
            </div>
          </div>
          
          {isSidebarOpen && (
            <button 
              onClick={navigateToSettings}
              onMouseEnter={() => setIsSpinning(true)}
              onMouseLeave={() => setIsSpinning(false)}
              className={`p-2 rounded-full hover:bg-gray-200 transition-colors duration-200`}
              aria-label="Settings"
            >
              <Settings className={`w-6 h-6 text-black ${isSpinning ? "animate-spin" : ""}`} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function SidebarLink({
  href,
  icon: Icon,
  children,
  isOpen,
  currentPath,
}: {
  href: string
  icon: React.ElementType
  children: React.ReactNode
  isOpen: boolean
  currentPath: string
}) {
  const isActive = currentPath === href
  
  return (
    <Link
      href={href}
      className="flex items-center text-black/90 hover:text-black mb-12 transition-all duration-300 ease-in-out relative"
      style={{ transform: isOpen ? "translateX(1rem)" : "translateX(0.75rem)" }}
    >
      <Icon className={`w-8 h-8 shrink-0 ${isActive ? 'text-yellow-450' : ''}`} />
      <span
        className={`ml-3 text-lg transition-all duration-300 ease-in-out origin-left overflow-hidden whitespace-nowrap ${
          isActive ? 'text-yellow-450 font-semibold' : ''
        }`}
        style={{ opacity: isOpen ? 1 : 0, width: isOpen ? "auto" : 0 }}
      >
        {children}
      </span>
    </Link>
  )
}

function RecentItem({
  item,
  type,
  onClick,
  formatTime,
}: {
  item: {
    id: string;
    query?: string;
    title?: string;
    created_at?: string;
    updated_at?: string;
  };
  type: 'search' | 'learn';
  onClick: () => void;
  formatTime: (timestamp: string) => string;
}) {
  const getTitle = () => {
    if (type === 'search') {
      return item.query || 'Untitled search'
    } else {
      return item.title || 'Untitled conversation'
    }
  }

  const getTimestamp = () => {
    if (type === 'search') {
      return item.created_at || ''
    } else {
      return item.updated_at || ''
    }
  }

  return (
    <div 
      className="py-3 text-gray-800 hover:bg-emerald-500/10 cursor-pointer transition-colors duration-200 group border-b border-gray-100 last:border-b-0"
      onClick={onClick}
    >
      <div className="text-base font-medium leading-relaxed">
        {getTitle()}
      </div>
    </div>
  )
}

