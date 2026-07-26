/**
 * Normalize and validate seller shop outbound links.
 * Empty input → null. Rejects non-https and off-platform social hosts.
 */

const MAX_URL = 500

function stripHandle(raw: string): string {
  return raw.replace(/^@+/, '').replace(/^\/+/, '').trim()
}

function tryParseHttps(raw: string): URL | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  try {
    const withScheme = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`
    const url = new URL(withScheme)
    if (url.protocol !== 'https:') return null
    if (url.username || url.password) return null
    return url
  } catch {
    return null
  }
}

export function normalizeWebsiteUrl(
  raw: string | null | undefined
): { url: string | null; error?: string } {
  const trimmed = (raw || '').trim()
  if (!trimmed) return { url: null }
  const url = tryParseHttps(trimmed)
  if (!url) return { url: null, error: 'Website must be a valid https URL' }
  const host = url.hostname.toLowerCase()
  if (
    host === 'localhost' ||
    host.endsWith('.local') ||
    /^\d+\.\d+\.\d+\.\d+$/.test(host)
  ) {
    return { url: null, error: 'Website host is not allowed' }
  }
  const out = url.toString().slice(0, MAX_URL)
  return { url: out }
}

export function normalizeInstagramUrl(
  raw: string | null | undefined
): { url: string | null; error?: string } {
  const trimmed = (raw || '').trim()
  if (!trimmed) return { url: null }

  // Bare handle → profile URL
  if (!/^https?:\/\//i.test(trimmed) && !trimmed.includes('/')) {
    const handle = stripHandle(trimmed).replace(/[^A-Za-z0-9._]/g, '')
    if (!handle || handle.length > 30) {
      return { url: null, error: 'Invalid Instagram handle' }
    }
    return { url: `https://www.instagram.com/${handle}/`.slice(0, MAX_URL) }
  }

  const url = tryParseHttps(trimmed)
  if (!url) return { url: null, error: 'Instagram must be a valid https URL' }
  const host = url.hostname.toLowerCase().replace(/^www\./, '')
  if (host !== 'instagram.com') {
    return { url: null, error: 'Instagram link must be on instagram.com' }
  }
  const path = url.pathname.replace(/\/+$/, '')
  const match = path.match(/^\/([A-Za-z0-9._]{1,30})$/)
  if (!match) {
    return { url: null, error: 'Use an Instagram profile URL or @handle' }
  }
  return {
    url: `https://www.instagram.com/${match[1]}/`.slice(0, MAX_URL),
  }
}

export function normalizeXUrl(
  raw: string | null | undefined
): { url: string | null; error?: string } {
  const trimmed = (raw || '').trim()
  if (!trimmed) return { url: null }

  if (!/^https?:\/\//i.test(trimmed) && !trimmed.includes('/')) {
    const handle = stripHandle(trimmed).replace(/[^A-Za-z0-9_]/g, '')
    if (!handle || handle.length > 15) {
      return { url: null, error: 'Invalid X handle' }
    }
    return { url: `https://x.com/${handle}`.slice(0, MAX_URL) }
  }

  const url = tryParseHttps(trimmed)
  if (!url) return { url: null, error: 'X link must be a valid https URL' }
  const host = url.hostname.toLowerCase().replace(/^www\./, '')
  if (host !== 'x.com' && host !== 'twitter.com') {
    return { url: null, error: 'X link must be on x.com or twitter.com' }
  }
  const path = url.pathname.replace(/\/+$/, '')
  const match = path.match(/^\/([A-Za-z0-9_]{1,15})$/)
  if (!match) {
    return { url: null, error: 'Use an X profile URL or @handle' }
  }
  return { url: `https://x.com/${match[1]}`.slice(0, MAX_URL) }
}
