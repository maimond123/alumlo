"use client"

import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../data/supabase'
import { getUserEmail } from '../utils/auth'
import type { ReactNode } from 'react'

interface OrganizationContextType {
  organizationName: string | null
  tableId: string | null
  setOrganizationName: (name: string | null) => void
  isLoading: boolean
}

const OrganizationContext = createContext<OrganizationContextType>({
  organizationName: null,
  tableId: null,
  setOrganizationName: () => {},
  isLoading: true
})

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [organizationName, setOrganizationName] = useState<string | null>(null)
  const [tableId, setTableId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Add debug log when organizationName changes
  useEffect(() => {
    console.log("DEBUG: OrganizationContext - organizationName changed to:", organizationName)
  }, [organizationName])

  useEffect(() => {
    const getOrganizationInfo = async () => {
      try {
        console.log("DEBUG: OrganizationContext - fetching organization info")
        // Get user email from Supabase auth
        const userEmail = await getUserEmail()
        
        // If no user email, just set loading to false and return
        if (!userEmail) {
          console.log("DEBUG: OrganizationContext - no user found")
          setIsLoading(false)
          return
        }
  
        console.log("DEBUG: OrganizationContext - user email:", userEmail)
        
        // If we have a user, get their organization info
        console.log("DEBUG: OrganizationContext - querying Supabase for organization info")
        const { data, error } = await supabase
          .from('customer_information')
          .select('school_name, table_name') // Assuming 'school_name' is the actual DB column name
          .eq('organization_email', userEmail)
          .single()
        
        if (error) {
          console.error("DEBUG: OrganizationContext - Supabase error:", error)
        }
        
        console.log("DEBUG: OrganizationContext - Supabase response:", data)
        
        if (data) {
          console.log("DEBUG: OrganizationContext - setting organization name to:", data.school_name)
          setOrganizationName(data.school_name) // Value from DB column 'school_name'
          setTableId(data.table_name)
        } else {
          console.log("DEBUG: OrganizationContext - no data returned from Supabase")
        }
      } catch (error) {
        console.error('Error in getOrganizationInfo:', error)
      } finally {
        setIsLoading(false)
      }
    }
  
    getOrganizationInfo()
  }, [])

  return (
    <OrganizationContext.Provider value={{ 
      organizationName, 
      tableId,
      setOrganizationName,
      isLoading
    }}>
      {children}
    </OrganizationContext.Provider>
  )
}

export const useOrganization = () => useContext(OrganizationContext) 