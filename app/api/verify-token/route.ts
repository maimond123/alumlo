// app/api/verify-token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const JWT_SECRET = 'REMOVED_CREDENTIAL';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    
    if (!token) {
      return NextResponse.json({ valid: false, message: 'Token is required' }, { status: 400 });
    }
    
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
    const email = decoded.email;
    
    // Create a Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Check if the email exists in the customer_information table
    const { data, error } = await supabase
      .from('customer_information')
      .select('school_name')
      .eq('school_email', email)
      .single();
    
    if (error || !data) {
      return NextResponse.json({ 
        valid: false, 
        message: 'Email not found in our system' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      valid: true, 
      email: email,
      schoolName: data.school_name
    });
    
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return NextResponse.json({ 
        valid: false, 
        message: 'Link has expired. Please request a new one.' 
      }, { status: 401 });
    }
    
    return NextResponse.json({ 
      valid: false, 
      message: 'Invalid token' 
    }, { status: 400 });
  }
}