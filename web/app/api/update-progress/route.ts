
import { NextResponse } from 'next/server';
import { supabase } from '../../data/supabase';

// Hits the database on every call; never evaluate this at build time.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get all ongoing uploads (not completed or error)
    const { data, error } = await supabase
      .from('uploaded_data_progress_tracker')
      .select('*')
      .eq('status', 'processing')
      .lt('progress', 100); // Only those that haven't reached 100%
    
    if (error) throw error;
    
    // Process each upload
    const updates = [];
    
    for (const upload of data || []) {
        const uploadTime = new Date(upload.created_at); // Changed from upload_time to created_at
        const now = new Date();
        const hoursSinceUpload = (now.getTime() - uploadTime.getTime()) / (1000 * 60 * 60);      
      
      // Calculate how many 3-hour periods have passed (each worth 5%)
      const periodsElapsed = Math.floor(hoursSinceUpload / 3);
      const expectedProgress = Math.min(10 + (periodsElapsed * 5), 95); // Initial 10% + 5% per period, max 95%
      
      // Only update if the calculated progress is higher than current progress
      if (expectedProgress > upload.progress) {
        const { error: updateError } = await supabase
          .from('uploaded_data_progress_tracker')
          .update({ progress: expectedProgress })
          .eq('id', upload.id);
          
        if (updateError) {
          console.error(`Error updating progress for upload ${upload.id}:`, updateError);
          continue;
        }
        
        updates.push({
          id: upload.id,
          oldProgress: upload.progress,
          newProgress: expectedProgress
        });
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Updated progress for ${updates.length} uploads`,
      updates
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}