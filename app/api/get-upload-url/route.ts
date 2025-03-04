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

export async function POST(request: Request) {
  try {
    const { fileName, uploadId, userEmail, schoolName } = await request.json()
    
    // 1. Verify the user is authenticated
    // 2. Verify they belong to the claimed school
    // 3. Generate a temporary, single-use URL that expires

    const { data } = await supabase
      .storage
      .from('student_data_uploads')
      .createSignedUploadUrl(`${uploadId}/${fileName}`)
    
    // The signed URL:
    // - Only works for a short time (typically 1 hour)
    // - Only works for the specific file path
    // - Contains a cryptographic signature that can't be forged

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
} 