/** Prefer unoptimized next/image for local uploads and non-HTTPS remotes. */
export function shouldUnoptimizeProductImage(url: string): boolean {
  if (!url) return true
  if (url.startsWith('/uploads/')) return true
  if (url.startsWith('http://')) return true
  return false
}
