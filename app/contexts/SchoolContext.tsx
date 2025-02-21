"use client"

import { createContext, useContext, useState, useEffect } from 'react'
import { getCurrentUser } from '@aws-amplify/auth'
import { supabase } from '../data/supabase'
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

  useEffect(() => {
    const getSchoolInfo = async () => {
      try {
        // Try to get current user
        const user = await getCurrentUser().catch(() => null)
        
        // If no user, just set loading to false and return
        if (!user?.username) {
          setIsLoading(false)
          return
        }

        // If we have a user, get their school info
        const { data } = await supabase
          .from('customer_information')
          .select('school_name, table_name')
          .eq('school_email', user.username)
          .single()
        
        if (data) {
          setSchoolName(data.school_name)
          setTableId(data.table_name)
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