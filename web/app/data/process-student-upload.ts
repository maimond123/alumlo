import { NextRequest, NextResponse } from 'next/server'
import { parse } from 'csv-parse/sync'

import { supabase } from './supabase'

export async function POST(req: NextRequest) {
  const { uploadId } = await req.json()

  try {
    // Get file from storage
    const { data: upload } = await supabase
      .from('uploaded_data_progress_tracker')
      .select('*')
      .eq('id', uploadId)
      .single()

    const { data: fileData, error: fileError } = await supabase
      .storage
      .from('student_data_uploads')
      .download(`${uploadId}/${upload.file_name}`)
    
    if (fileError || !fileData) {
      throw new Error(`Failed to download file: ${fileError?.message || 'File data is missing'}`)
    }

    const text = await fileData.text()
    const records = parse(text, { columns: false, skip_empty_lines: true, from_line: 2 })

    // Process each row - now using school_name
    for (const [firstName, lastName, university] of records) {
      await supabase
        .from('student_data_uploads')
        .insert({
          first_name: firstName,
          last_name: lastName,
          university: university,
          upload_id: uploadId,
          school_name: upload.school_name
        })
    }

    // Update upload status
    await supabase
      .from('uploaded_data_progress_tracker')
      .update({ 
        status: 'completed',
        progress: 100,
        message: 'Processing completed successfully'
      })
      .eq('id', uploadId)

    return NextResponse.json({ success: true })
  } catch (error) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unknown error occurred';
    
    return NextResponse.json(
      { error: errorMessage }, 
      { status: 500 }
    )
  }
} 