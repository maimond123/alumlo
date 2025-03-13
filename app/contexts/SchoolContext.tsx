"use client"

import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../data/supabase'
import { getUserEmail } from '../utils/auth'
import type { ReactNode } from 'react'

interface SchoolContextType {
  schoolName: string | null
  tableId: string | null
  setSchoolName: (name: string | null) => void
  isLoading: boolean
}

const SchoolContext = createContext<SchoolContextType>({
  schoolName: null,
  tableId: null,
  setSchoolName: () => {},
  isLoading: true
})

export function SchoolProvider({ children }: { children: ReactNode }) {
  const [schoolName, setSchoolName] = useState<string | null>(null)
  const [tableId, setTableId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Add debug log when schoolName changes
  useEffect(() => {
    console.log("DEBUG: SchoolContext - schoolName changed to:", schoolName)
  }, [schoolName])

  useEffect(() => {
    const getSchoolInfo = async () => {
      try {
        console.log("DEBUG: SchoolContext - fetching school info")
        // Get user email from Supabase auth
        const userEmail = await getUserEmail()
        
        // If no user email, just set loading to false and return
        if (!userEmail) {
          console.log("DEBUG: SchoolContext - no user found")
          setIsLoading(false)
          return
        }
  
        console.log("DEBUG: SchoolContext - user email:", userEmail)
        
        // If we have a user, get their school info
        console.log("DEBUG: SchoolContext - querying Supabase for school info")
        const { data, error } = await supabase
          .from('customer_information')
          .select('school_name, table_name')
          .eq('school_email', userEmail)
          .single()
        
        if (error) {
          console.error("DEBUG: SchoolContext - Supabase error:", error)
        }
        
        console.log("DEBUG: SchoolContext - Supabase response:", data)
        
        if (data) {
          console.log("DEBUG: SchoolContext - setting school name to:", data.school_name)
          setSchoolName(data.school_name)
          setTableId(data.table_name)
        } else {
          console.log("DEBUG: SchoolContext - no data returned from Supabase")
        }
      } catch (error) {
        console.error('Error in getSchoolInfo:', error)
      } finally {
        setIsLoading(false)
      }
    }
  
    getSchoolInfo()
  }, [])

  return (
    <SchoolContext.Provider value={{ 
      schoolName, 
      tableId,
      setSchoolName,
      isLoading
    }}>
      {children}
    </SchoolContext.Provider>
  )
}

export const useSchool = () => useContext(SchoolContext) 