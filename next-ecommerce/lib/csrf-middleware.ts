import { NextRequest, NextResponse } from 'next/server'
import { verifyCSRFToken } from './csrf'

/**
 * CSRF middleware for protecting API routes
 */
export async function csrfMiddleware(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  // Skip CSRF check for GET requests
  if (request.method === 'GET') {
    return handler(request)
  }

  // Skip CSRF check for public endpoints
  const publicEndpoints = [
    '/api/auth',
    '/api/csrf',
    '/api/health',
  ]
  
  const url = new URL(request.url)
  const isPublicEndpoint = publicEndpoints.some(endpoint => 
    url.pathname.startsWith(endpoint)
  )
  
  if (isPublicEndpoint) {
    return handler(request)
  }

  // Verify CSRF token for all other requests
  const isValid = await verifyCSRFToken(request)
  if (!isValid) {
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 }
    )
  }

  return handler(request)
}

/**
 * Higher-order function to wrap API handlers with CSRF protection
 */
export function withCSRF<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    return csrfMiddleware(request, (req) => handler(req, ...args))
  }
} 