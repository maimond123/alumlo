import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY')
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',  // Allow requests from any origin
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',  // Allow these HTTP methods
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',  // Allow these headers
    },
  })
}

export async function POST(request: Request) {
  try {
    const { fileName, uploadId, userEmail, schoolName } = await request.json()
    
    // Generate signed URL with options
    const { data, error } = await supabase
      .storage
      .from('student_data_uploads')
      .createSignedUploadUrl(`${uploadId}/${fileName}`)

    if (error) throw error

    // Return with CORS headers
    return new NextResponse(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error) {
    console.error('Error generating signed URL:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Failed to generate upload URL' }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    )
  }
} 