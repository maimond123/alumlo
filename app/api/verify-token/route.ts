import { NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  "https://cxqxzmcvzzwtqkqoyuti.supabase.co",
  "REMOVED_CREDENTIAL"

)

export async function POST(req: Request) {
  try {
    const { token } = await req.json()

    // Call Flask API to verify JWT token
    const response = await fetch('http://localhost:3005/verify-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token })
    })

    if (!response.ok) {
      console.error("Flask API error:", await response.text())
      return NextResponse.json(
        { message: "Token verification failed" }, 
        { status: 400 }
      )
    }

    const data = await response.json()

    if (!data.valid) {
      return NextResponse.json(
        { message: data.error }, 
        { status: 400 }
      )
    }

    // If verification successful, return email and user_id
    return NextResponse.json({
      email: data.email,
      userId: data.user_id,
      message: "Token verified successfully"
    })

  } catch (error) {
    console.error("Token verification failed:", error)
    return NextResponse.json(
      { message: "Token verification failed" }, 
      { status: 400 }
    )
  }
}