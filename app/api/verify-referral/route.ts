import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { referralCode } = await request.json();
    
    // Check if the referral code exists
    const { data, error } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('code', referralCode)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 });
    }

    // Check if the code has uses remaining
    if (data.uses_remaining <= 0) {
      return NextResponse.json({ error: 'Referral code has reached its usage limit' }, { status: 400 });
    }

    // Update the referral code usage
    const now = new Date().toISOString();
    await supabase
      .from('referral_codes')
      .update({ 
        uses_remaining: data.uses_remaining - 1,
        ...(data.first_used_at ? {} : { first_used_at: now }),
        last_used_at: now
      })
      .eq('id', data.id);

    // Authenticate as admin (server-side only)
    const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
      email: process.env.ADMIN_EMAIL!,
      password: process.env.ADMIN_PASSWORD!,
    });

    if (loginError) {
      return NextResponse.json({ error: 'Authentication error' }, { status: 500 });
    }

    // Return the session for the client to use
    return NextResponse.json({ 
      success: true,
      session: authData.session
    });
  } catch (error) {
    console.error('Error processing referral:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 