'use client'

import { useEffect } from 'react'
import { supabase } from '../app/data/supabase'

export default function SupabaseAuthListener({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  useEffect(() => {
    // Set up Supabase auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log(`Auth state changed: ${event}`, session)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return <>{children}</>
}