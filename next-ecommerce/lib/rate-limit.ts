interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

export class RateLimiter {
  private windowMs: number
  private maxRequests: number

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs
    this.maxRequests = maxRequests
  }

  isRateLimited(identifier: string): boolean {
    const now = Date.now()
    const record = store[identifier]

    if (!record || now > record.resetTime) {
      // Reset or create new record
      store[identifier] = {
        count: 1,
        resetTime: now + this.windowMs,
      }
      return false
    }

    if (record.count >= this.maxRequests) {
      return true
    }

    record.count++
    return false
  }

  getRemainingRequests(identifier: string): number {
    const record = store[identifier]
    if (!record || Date.now() > record.resetTime) {
      return this.maxRequests
    }
    return Math.max(0, this.maxRequests - record.count)
  }

  getResetTime(identifier: string): number {
    const record = store[identifier]
    return record ? record.resetTime : Date.now() + this.windowMs
  }
}

// Create rate limiters for different endpoints
export const apiRateLimiter = new RateLimiter(60000, 100) // 100 requests per minute
export const authRateLimiter = new RateLimiter(60000, 5) // 5 auth attempts per minute
export const searchRateLimiter = new RateLimiter(60000, 50) // 50 searches per minute

// Helper function to get client identifier
export const getClientIdentifier = (req: Request): string => {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
  return ip
} 