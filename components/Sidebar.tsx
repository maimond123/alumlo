"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { BarChart2, FileText, Settings, HelpCircle, LogOut, Home, Upload } from "lucide-react"
import { useSidebar } from "./SidebarProvider"
import { supabase } from "../app/data/supabase"
import type React from "react"
import { useRouter } from 'next/navigation'
import { getUserEmail, signOutUser, getCurrentUser } from '../app/utils/auth'

interface UserInfo {
  first_name: string;
  last_name: string;
  school_name: string;
}

export default function Sidebar() {
  const { isSidebarOpen, openSidebar, closeSidebar } = useSidebar()
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const router = useRouter()
  
  const handleLogout = async () => {
    try {
      await signOutUser()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

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
        <div
          className="flex items-center mb-8 transition-transform duration-300 ease-in-out"
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

        <div
          className="flex items-center mb-8 transition-transform duration-300 ease-in-out"
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

        <nav className="flex-1 mt-3">
          <SidebarLink href="/dashboard" icon={Home} isOpen={isSidebarOpen}>
            Dashboard
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
          <SidebarLink href="/support" icon={HelpCircle} isOpen={isSidebarOpen}>
            Support
          </SidebarLink>
        </nav>

        <button
          onClick={handleLogout}
          className="mt-auto flex items-center text-black/90 hover:text-black transition-transform duration-300 ease-in-out"
          style={{ transform: isSidebarOpen ? "translateX(1.5rem)" : "translateX(1rem)" }}
        >
          <LogOut className="w-8 h-8 shrink-0" />
          <span
            className="ml-3 text-lg transition-all duration-300 ease-in-out origin-left overflow-hidden whitespace-nowrap"
            style={{ opacity: isSidebarOpen ? 1 : 0, width: isSidebarOpen ? "auto" : 0 }}
          >
            Logout
          </span>
        </button>
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
      className="flex items-center text-black/90 hover:text-black mb-8 transition-transform duration-300 ease-in-out relative"
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

