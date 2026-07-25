import type { NextConfig } from 'next'

function s3RemotePattern() {
  const base = process.env.S3_PUBLIC_BASE_URL?.trim()
  if (!base) return null
  try {
    const url = new URL(base)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return {
      protocol: url.protocol.replace(':', '') as 'http' | 'https',
      hostname: url.hostname,
      ...(url.port ? { port: url.port } : {}),
      pathname: '/**' as const,
    }
  } catch {
    return null
  }
}

const s3Pattern = s3RemotePattern()

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'covers.openlibrary.org',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      // AWS S3 object URLs (virtual-hosted and path-style regions)
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      ...(s3Pattern ? [s3Pattern] : []),
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ]
  },
}

export default nextConfig
