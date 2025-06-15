import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('OAuth callback error:', error)
        return NextResponse.redirect(`${origin}/signin?error=oauth_error`)
      }

      if (data.session && data.user) {
        // Check if this is a new user by calling our API
        const response = await fetch(`${origin}/api/oauth-callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user: data.user,
            session: data.session
          })
        })

        const result = await response.json()

        if (!response.ok) {
          console.error('OAuth callback API error:', result)
          return NextResponse.redirect(`${origin}/signin?error=setup_error`)
        }

        // Redirect based on whether this is a new user
        if (result.isNewUser) {
          return NextResponse.redirect(`${origin}/dashboard?new_user=true`)
        } else {
          return NextResponse.redirect(`${origin}/dashboard`)
        }
      }
    } catch (error) {
      console.error('OAuth exchange error:', error)
      return NextResponse.redirect(`${origin}/signin?error=exchange_error`)
    }
  }

  // If no code or other error, redirect to signin
  return NextResponse.redirect(`${origin}/signin?error=no_code`)
} 