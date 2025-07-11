const base = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com'
const TIMEOUT_MS = 10000 // 10 seconds timeout
const MAX_RETRIES = 3

// Retry function with exponential backoff
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES
): Promise<T> => {
  try {
    return await fn()
  } catch (error) {
    if (retries <= 0) throw error
    
    const delay = Math.pow(2, MAX_RETRIES - retries) * 1000 // Exponential backoff
    await new Promise(resolve => setTimeout(resolve, delay))
    
    return retryWithBackoff(fn, retries - 1)
  }
}

// Fetch with timeout
const fetchWithTimeout = async (url: string, options: RequestInit, timeout: number = TIMEOUT_MS) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout - PayPal service is not responding')
    }
    throw error
  }
}

export const paypal = {
  createOrder: async function createOrder(price: number) {
    return retryWithBackoff(async () => {
      const accessToken = await generateAccessToken()
      const url = `${base}/v2/checkout/orders`
      
      const response = await fetchWithTimeout(url, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [
            {
              amount: {
                currency_code: 'USD',
                value: price.toString(), // Ensure price is string
              },
            },
          ],
        }),
      })
      
      return handleResponse(response)
    })
  },

  capturePayment: async function capturePayment(orderId: string) {
    return retryWithBackoff(async () => {
      const accessToken = await generateAccessToken()
      const url = `${base}/v2/checkout/orders/${orderId}/capture`
      
      const response = await fetchWithTimeout(url, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      })

      return handleResponse(response)
    })
  },
}

async function generateAccessToken() {
  const { PAYPAL_CLIENT_ID, PAYPAL_APP_SECRET } = process.env
  
  if (!PAYPAL_CLIENT_ID || !PAYPAL_APP_SECRET) {
    throw new Error('PayPal credentials not configured')
  }
  
  const auth = Buffer.from(PAYPAL_CLIENT_ID + ':' + PAYPAL_APP_SECRET).toString('base64')
  
  const response = await fetchWithTimeout(`${base}/v1/oauth2/token`, {
    method: 'post',
    body: 'grant_type=client_credentials',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })

  const jsonData = await handleResponse(response)
  
  if (!jsonData.access_token) {
    throw new Error('Failed to obtain PayPal access token')
  }
  
  return jsonData.access_token
}

async function handleResponse(response: Response) {
  if (response.status === 200 || response.status === 201) {
    try {
      return await response.json()
    } catch (error) {
      throw new Error('Invalid JSON response from PayPal')
    }
  }

  let errorMessage = 'PayPal request failed'
  
  try {
    const errorData = await response.json()
    errorMessage = errorData.message || errorData.error_description || errorMessage
  } catch {
    // If JSON parsing fails, try text
    try {
      errorMessage = await response.text()
    } catch {
      errorMessage = `HTTP ${response.status}: ${response.statusText}`
    }
  }

  // Provide user-friendly error messages
  if (response.status === 401) {
    throw new Error('PayPal authentication failed - please check credentials')
  } else if (response.status === 404) {
    throw new Error('PayPal order not found')
  } else if (response.status >= 500) {
    throw new Error('PayPal service is temporarily unavailable - please try again later')
  } else {
    throw new Error(`PayPal error: ${errorMessage}`)
  }
}
