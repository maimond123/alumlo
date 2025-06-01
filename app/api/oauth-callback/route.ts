import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export async function POST(request: Request) {
  try {
    const { user, session } = await request.json()
    
    if (!user || !session) {
      return NextResponse.json({ error: 'Missing user or session data' }, { status: 400 })
    }

    // Check if this is a new user (first time OAuth login)
    const { data: existingCustomer, error: customerCheckError } = await supabase
      .from('customer_information')
      .select('*')
      .eq('organization_email', user.email)
      .single()

    if (customerCheckError && customerCheckError.code !== 'PGRST116') {
      console.error('Error checking existing customer:', customerCheckError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // If this is a new user, create customer_information record
    if (!existingCustomer) {
      const { error: insertError } = await supabase
        .from('customer_information')
        .insert([
          {
            organization_email: user.email,
            first_name: user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || '',
            last_name: user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
            organization_name: user.user_metadata?.organization_name || '',
            auth_provider: user.app_metadata?.provider || 'unknown',
            created_at: new Date().toISOString()
          }
        ])

      if (insertError) {
        console.error('Error creating customer record:', insertError)
        return NextResponse.json({ error: 'Failed to create customer record' }, { status: 500 })
      }

      // Return indication that this is a new user who should schedule a demo
      return NextResponse.json({ 
        success: true, 
        isNewUser: true,
        message: 'New user created successfully' 
      })
    }

    // Existing user, just proceed to dashboard
    return NextResponse.json({ 
      success: true, 
      isNewUser: false,
      message: 'Existing user logged in successfully' 
    })

  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 