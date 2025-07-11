import { randomBytes, createHmac } from 'crypto'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const CSRF_SECRET = process.env.CSRF_SECRET || 'your-csrf-secret-key-change-in-production'
const CSRF_TOKEN_NAME = 'csrf-token'
const CSRF_HEADER_NAME = 'x-csrf-token'

/**
 * Generate a CSRF token
 */
export function generateCSRFToken(): string {
  const token = randomBytes(32).toString('hex')
  const timestamp = Date.now().toString()
  const signature = createHmac('sha256', CSRF_SECRET)
    .update(token + timestamp)
    .digest('hex')
  
  return `${token}.${timestamp}.${signature}`
}

/**
 * Validate a CSRF token
 */
export function validateCSRFToken(token: string): boolean {
  try {
    const [tokenPart, timestamp, signature] = token.split('.')
    
    if (!tokenPart || !timestamp || !signature) {
      return false
    }

    // Check if token is expired (24 hours)
    const tokenAge = Date.now() - parseInt(timestamp)
    if (tokenAge > 24 * 60 * 60 * 1000) {
      return false
    }

    // Verify signature
    const expectedSignature = createHmac('sha256', CSRF_SECRET)
      .update(tokenPart + timestamp)
      .digest('hex')
    
    return signature === expectedSignature
  } catch {
    return false
  }
}

/**
 * Get CSRF token from cookies (server-side)
 */
export async function getCSRFToken(): Promise<string> {
  const cookieStore = await cookies()
  let token = cookieStore.get(CSRF_TOKEN_NAME)?.value

  if (!token || !validateCSRFToken(token)) {
    token = generateCSRFToken()
  }

  return token
}

/**
 * Get CSRF token from request headers (server-side)
 */
export function getCSRFTokenFromRequest(req: NextRequest): string | null {
  return req.headers.get(CSRF_HEADER_NAME) || req.nextUrl.searchParams.get('csrf')
}

/**
 * Set CSRF token in cookies using NextResponse
 */
export function setCSRFTokenCookie(token: string): NextResponse {
  const response = NextResponse.json({ token })
  response.cookies.set(CSRF_TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60, // 24 hours
    path: '/',
  })
  return response
}

/**
 * Verify CSRF token from request
 */
export async function verifyCSRFToken(req: NextRequest): Promise<boolean> {
  const requestToken = getCSRFTokenFromRequest(req)
  const cookieToken = await getCSRFToken()
  
  if (!requestToken || !cookieToken) {
    return false
  }

  return requestToken === cookieToken && validateCSRFToken(requestToken)
}

export { CSRF_TOKEN_NAME, CSRF_HEADER_NAME } 