'use client'

export function useCSRF() {
  const [csrfToken, setCsrfToken] = (globalThis as any).React?.useState?.(null) || [null, () => {}]
  const [isLoading, setIsLoading] = (globalThis as any).React?.useState?.(true) || [true, () => {}]

  ;(globalThis as any).React?.useEffect?.(() => {
    const fetchCSRFToken = async () => {
      try {
        const response = await fetch('/api/csrf', {
          method: 'GET',
          credentials: 'include',
        })
        
        if (response.ok) {
          const data = await response.json()
          setCsrfToken(data.token)
        } else {
          console.error('Failed to fetch CSRF token')
        }
      } catch (error) {
        console.error('Error fetching CSRF token:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCSRFToken()
  }, [])

  const refreshToken = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/csrf', {
        method: 'POST',
        credentials: 'include',
      })
      
      if (response.ok) {
        const data = await response.json()
        setCsrfToken(data.token)
      }
    } catch (error) {
      console.error('Error refreshing CSRF token:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    csrfToken,
    isLoading,
    refreshToken,
  }
} 