"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { BarChart2, FileText, Home, Upload, Brain, Search, MessageCircle } from "lucide-react"
import { useSidebar } from "./SidebarProvider"
import { supabase } from "../app/data/supabase"
import type React from "react"
import { getUserEmail, getCurrentUser } from '../app/utils/auth'
import { useRecentActivity } from '../hooks/useRecentActivity'
import { useRouter } from 'next/navigation'

interface UserInfo {
  first_name: string;
  last_name: string;
  school_name: string;
}

export default function Sidebar() {
  const { isSidebarOpen, openSidebar, closeSidebar } = useSidebar()
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const router = useRouter()
  
  // Add recent activity hook
  const { recentActivity, loadRecentActivity, formatActivityTitle, formatActivityTime } = useRecentActivity()

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
          .select('first_name, last_name, school_name')
          .eq('school_email', userEmail)
          .single()
        
        if (error) {
          return
        }
        
        if (data) {
          setUserInfo({
            first_name: data.first_name,
            last_name: data.last_name,
            school_name: data.school_name
          })
        }
      } catch (error) {
        // Silently handle error
      }
    }
    
    getUserInfo()
  }, [])

  // Load recent activity when sidebar opens
  useEffect(() => {
    if (isSidebarOpen) {
      loadRecentActivity()
    }
  }, [isSidebarOpen, loadRecentActivity])

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

  return (
    <motion.div
      className={`fixed top-0 left-0 h-full bg-transparent flex flex-col border-r border-black z-20 overflow-hidden transition-[width] duration-300 ease-in-out`}
      initial={false}
      animate={{ width: isSidebarOpen ? "18rem" : "6rem" }}
      onMouseEnter={openSidebar}
      onMouseLeave={closeSidebar}
    >
      <div className="p-6 flex flex-col h-full w-full">
        {/* Logo Section with more space below */}
        <div
          className="flex items-center mb-16 transition-transform duration-300 ease-in-out"
          style={{ transform: isSidebarOpen ? "translateX(1.5rem)" : "translateX(0.75rem)" }}
        >
          <Image
            src="/assets/icons8-atom-24.png"
            alt="AlumIntel Logo"
            width={32}
            height={32}
            className="transition-transform duration-300 ease-in-out shrink-0"
          />
          <span
            className={`ml-3 text-black text-2xl font-bold transition-all duration-300 ease-in-out origin-left`}
            style={{ opacity: isSidebarOpen ? 1 : 0, transform: isSidebarOpen ? "scaleX(1)" : "scaleX(0)" }}
          >
            AlumIntel
          </span>
        </div>

        {/* Navigation Links with more space between them */}
        <nav className="flex-1">
          <SidebarLink href="/dashboard" icon={Home} isOpen={isSidebarOpen}>
            Dashboard
          </SidebarLink>
          <SidebarLink href="/learn" icon={Brain} isOpen={isSidebarOpen}>
            Learn
          </SidebarLink>
          <SidebarLink href="/data-insights" icon={BarChart2} isOpen={isSidebarOpen}>
            Analytics
          </SidebarLink>
          <SidebarLink href="/reports" icon={FileText} isOpen={isSidebarOpen}>
            Reports
          </SidebarLink>
          <SidebarLink href="/upload-data" icon={Upload} isOpen={isSidebarOpen}>
            Upload Data
          </SidebarLink>
        </nav>

        {/* Recent Activity Section - Between navigation and profile */}
        {isSidebarOpen && (
          <div className="mb-6">
            <div className="px-6 mb-3">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Recent Activity</h3>
            </div>
            <div className="space-y-1 px-3 max-h-48 overflow-y-auto">
              {recentActivity.length > 0 ? (
                recentActivity.map((item) => (
                  <RecentActivityItem
                    key={item.id}
                    item={item}
                    formatActivityTime={formatActivityTime}
                    onClick={() => {
                      if (item.type === 'search') {
                        router.push('/dashboard')
                      } else {
                        router.push('/learn')
                      }
                    }}
                  />
                ))
              ) : (
                <div className="text-gray-500 text-sm px-3 py-2">
                  No recent activity
                </div>
              )}
            </div>
          </div>
        )}

        {/* Profile Section moved to bottom */}
        <div
          className="flex items-center transition-transform duration-300 ease-in-out"
          style={{ transform: isSidebarOpen ? "translateX(1.5rem)" : "translateX(0.5rem)" }}
        >
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
            <span className="text-black/80 text-base whitespace-nowrap">Admin</span>
          </div>
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
}: {
  href: string
  icon: React.ElementType
  children: React.ReactNode
  isOpen: boolean
}) {
  return (
    <Link
      href={href}
      className="flex items-center text-black/90 hover:text-black mb-12 transition-transform duration-300 ease-in-out relative"
      style={{ transform: isOpen ? "translateX(1.5rem)" : "translateX(0.75rem)" }}
    >
      <Icon className="w-8 h-8 shrink-0" />
      <span
        className="ml-3 text-lg transition-all duration-300 ease-in-out origin-left overflow-hidden whitespace-nowrap"
        style={{ opacity: isOpen ? 1 : 0, width: isOpen ? "auto" : 0 }}
      >
        {children}
      </span>
    </Link>
  )
}

function RecentActivityItem({
  item,
  onClick,
  formatActivityTime,
}: {
  item: {
    id: string;
    type: 'search' | 'learn';
    title: string;
    created_at: string;
  };
  onClick: () => void;
  formatActivityTime: (created_at: string) => string;
}) {
  const getIcon = () => {
    if (item.type === 'search') {
      return <Search className="w-4 h-4 text-gray-500" />
    } else {
      return <MessageCircle className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div 
      className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer transition-colors duration-200 group"
      onClick={onClick}
    >
      <div className="flex items-start space-x-2">
        <div className="mt-0.5 flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="truncate font-medium">
            {item.title}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {formatActivityTime(item.created_at)}
          </div>
        </div>
      </div>
    </div>
  )
}

