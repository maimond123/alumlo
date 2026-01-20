"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "../app/data/supabase"

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastAuthEvent, setLastAuthEvent] = useState<{ event: string, timestamp: number } | null>(null)

  useEffect(() => {
    // Get initial session first
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Initial session retrieved:', session?.user?.email || 'no user')
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('Error getting initial session:', error)
        // Don't set user to null on API errors - keep existing state
        if (!(error as Error)?.message?.includes('429') && !(error as Error)?.message?.includes('API key')) {
          setUser(null)
        }
      } finally {
        setIsLoading(false)
      }
    }
    
    getInitialSession()
    
    // Then listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const now = Date.now()
      console.log('Auth state changed:', event, session?.user?.email || 'no user', {
        timestamp: new Date().toISOString(),
        previousEvent: lastAuthEvent
      })
      
      // Ignore rapid SIGNED_OUT events and rate limiting related sign-outs
      if (event === 'SIGNED_OUT') {
        // Ignore if it happened too quickly after SIGNED_IN
        if (lastAuthEvent && lastAuthEvent.event === 'SIGNED_IN' && 
            (now - lastAuthEvent.timestamp) < 500) {
          console.log('Ignoring rapid SIGNED_OUT event after SIGNED_IN')
          return
        }
        
        // Ignore if we recently had a user and this might be due to API errors
        if (user && lastAuthEvent && (now - lastAuthEvent.timestamp) < 2000) {
          console.log('Ignoring potential API error related SIGNED_OUT event')
          return
        }
      }
      
      setLastAuthEvent({ event, timestamp: now })
      setUser(session?.user ?? null)
      // Don't set loading here since initial load is handled above
    })

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
  
}