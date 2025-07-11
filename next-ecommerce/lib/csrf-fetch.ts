/**
 * Enhanced fetch function that automatically includes CSRF tokens
 */
export async function csrfFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Get CSRF token from cookie
  const getCSRFToken = (): string | null => {
    if (typeof document === 'undefined') return null
    
    const cookies = document.cookie.split(';')
    const csrfCookie = cookies.find(cookie => 
      cookie.trim().startsWith('csrf-token=')
    )
    
    if (csrfCookie) {
      return csrfCookie.split('=')[1]
    }
    
    return null
  }

  const csrfToken = getCSRFToken()
  
  // Add CSRF token to headers
  const headers = new Headers(options.headers)
  if (csrfToken) {
    headers.set('x-csrf-token', csrfToken)
  }

  // Add CSRF token to body for POST/PUT/PATCH/DELETE requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method || 'GET')) {
    if (options.body) {
      try {
        const body = JSON.parse(options.body as string)
        body.csrf = csrfToken
        options.body = JSON.stringify(body)
      } catch {
        // If body is not JSON, add as form data
        const formData = new FormData()
        if (options.body instanceof FormData) {
          // Copy existing form data
          for (const [key, value] of options.body.entries()) {
            formData.append(key, value)
          }
        }
        formData.append('csrf', csrfToken || '')
        options.body = formData
      }
    } else {
      // No body, create one with CSRF token
      const formData = new FormData()
      formData.append('csrf', csrfToken || '')
      options.body = formData
    }
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Include cookies
  })
}

/**
 * Create a CSRF-protected form data object
 */
export function createCSRFFormData(data: Record<string, any>): FormData {
  const formData = new FormData()
  
  // Add CSRF token
  const csrfToken = document.cookie
    .split(';')
    .find(cookie => cookie.trim().startsWith('csrf-token='))
    ?.split('=')[1]
  
  if (csrfToken) {
    formData.append('csrf', csrfToken)
  }
  
  // Add other data
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value)
    }
  })
  
  return formData
} 