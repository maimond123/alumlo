import { NextResponse } from "next/server"
import { verify } from 'jsonwebtoken'

const JWT_SECRET = 'REMOVED_CREDENTIAL'

export async function POST(req: Request) {
  try {
    const { token } = await req.json()

    // Verify the JWT token
    const payload = verify(token, JWT_SECRET) as { email: string }
    
    return NextResponse.json({
      valid: true,
      email: payload.email,
      message: "Token verified successfully"
    })

  } catch (error) {
    console.error("Token verification failed:", error)
    return NextResponse.json(
      { valid: false, message: "Token verification failed" }, 
      { status: 400 }
    )
  }
}