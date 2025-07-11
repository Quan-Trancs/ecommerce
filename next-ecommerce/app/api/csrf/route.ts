import { NextRequest, NextResponse } from 'next/server'
import { generateCSRFToken, setCSRFTokenCookie, verifyCSRFToken } from '@/lib/csrf'

export async function GET() {
  try {
    const token = generateCSRFToken()
    const response = setCSRFTokenCookie(token)
    
    return response
  } catch (error) {
    console.error('CSRF token generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify existing token if provided
    const existingToken = request.headers.get('x-csrf-token')
    if (existingToken) {
      const isValid = await verifyCSRFToken(request)
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid CSRF token' },
          { status: 403 }
        )
      }
    }

    // Generate new token
    const token = generateCSRFToken()
    const response = setCSRFTokenCookie(token)
    
    return response
  } catch (error) {
    console.error('CSRF token refresh error:', error)
    return NextResponse.json(
      { error: 'Failed to refresh CSRF token' },
      { status: 500 }
    )
  }
} 