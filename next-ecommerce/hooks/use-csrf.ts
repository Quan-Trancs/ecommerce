'use client'

import { useCallback, useEffect, useState } from 'react'

export function useCSRF() {
  const [csrfToken, setCsrfToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const fetchCSRFToken = async () => {
      try {
        const response = await fetch('/api/csrf', {
          method: 'GET',
          credentials: 'include',
        })
        if (!response.ok) {
          console.error('Failed to fetch CSRF token')
          return
        }
        const data = (await response.json()) as { token?: string }
        if (!cancelled && data.token) {
          setCsrfToken(data.token)
        }
      } catch (error) {
        console.error('Error fetching CSRF token:', error)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    void fetchCSRFToken()
    return () => {
      cancelled = true
    }
  }, [])

  const refreshToken = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/csrf', {
        method: 'POST',
        credentials: 'include',
      })
      if (response.ok) {
        const data = (await response.json()) as { token?: string }
        if (data.token) setCsrfToken(data.token)
      }
    } catch (error) {
      console.error('Error refreshing CSRF token:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    csrfToken,
    isLoading,
    refreshToken,
  }
}
