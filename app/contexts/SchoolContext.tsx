"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../data/supabase'
import { normalizeSchoolName } from '../../components/schoolNameUtils'
import { getCurrentUser } from '@aws-amplify/auth'

interface SchoolContextType {
  schoolName: string | null  // Original school name for display
  tableId: string | null     // Normalized name for database queries
  setSchoolName: (name: string | null) => void
}

const SchoolContext = createContext<SchoolContextType>({
  schoolName: null,
  tableId: null,
  setSchoolName: () => {}
})

export function SchoolProvider({ children }: { children: ReactNode }) {
  const [schoolName, setSchoolName] = useState<string | null>(null)
  const [tableId, setTableId] = useState<string | null>(null)

  useEffect(() => {
    const getSchoolInfo = async () => {
      const { username: userEmail } = await getCurrentUser()
      if (userEmail) {
        const { data } = await supabase
          .from('customer_information')
          .select('school_name, table_name')
          .eq('school_email', userEmail)
          .single()
        
        if (data) {
          setSchoolName(data.school_name)
          setTableId(data.table_name)
        }
      }
    }

    getSchoolInfo()
  }, [])

  return (
    <SchoolContext.Provider value={{ 
      schoolName, 
      tableId,
      setSchoolName
    }}>
      {children}
    </SchoolContext.Provider>
  )
}

export const useSchool = () => useContext(SchoolContext) 