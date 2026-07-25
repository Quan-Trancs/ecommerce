import { normalizeRole } from '@/lib/auth/roles'

const DEFAULT_API_URL = 'http://localhost:8082/api'

function getStoreApiUrl() {
  return (
    process.env.CATALOG_API_URL?.replace(/\/$/, '') ||
    process.env.STORE_API_URL?.replace(/\/$/, '') ||
    DEFAULT_API_URL
  )
}

function getAdminApiKey() {
  return process.env.ADMIN_API_KEY || process.env.STORE_ADMIN_API_KEY || 'dev-admin-key'
}

export type StoreTokenSubject = {
  userId: string
  email?: string | null
  displayName?: string | null
  role?: string | null
}

/**
 * Server-only: mint a short-lived store API JWT for the signed-in subject.
 * Uses X-Admin-Key (BFF trust) — never call from the browser.
 */
export async function mintStoreAccessToken(
  subject: StoreTokenSubject
): Promise<string | null> {
  if (!subject.userId) return null

  try {
    const response = await fetch(`${getStoreApiUrl()}/v1/auth/token`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Admin-Key': getAdminApiKey(),
      },
      body: JSON.stringify({
        userId: subject.userId,
        email: subject.email || '',
        displayName: subject.displayName || '',
        role: normalizeRole(subject.role),
      }),
      cache: 'no-store',
    })

    if (!response.ok) {
      console.warn('Store token mint failed:', response.status, await response.text())
      return null
    }

    const data = (await response.json()) as { token?: string }
    return data.token || null
  } catch (error) {
    console.warn('Store token mint unavailable:', error)
    return null
  }
}

export async function storeAuthHeaders(
  subject: StoreTokenSubject
): Promise<Record<string, string>> {
  const token = await mintStoreAccessToken(subject)
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}
