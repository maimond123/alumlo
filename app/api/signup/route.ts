import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export async function POST(request: Request) {
  const { schoolName, state, demoDate } = await request.json()

  const { data, error } = await supabase
    .from("'signups'")
    .insert([
      { school_name: schoolName, state, demo_date: demoDate },
    ])

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: "'Signup successful'" }, { status: 200 })
}

