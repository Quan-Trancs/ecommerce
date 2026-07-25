import { mkdir, unlink, writeFile } from 'fs/promises'
import path from 'path'
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'

export type StoredProductImage = {
  /** Public URL or site-relative path for the product image. */
  url: string
  /** Where the bytes were written. */
  backend: 's3' | 'local'
}

function trimSlash(value: string) {
  return value.replace(/\/+$/, '')
}

export function isS3UploadConfigured(): boolean {
  return Boolean(
    process.env.S3_BUCKET?.trim() &&
      process.env.S3_ACCESS_KEY_ID?.trim() &&
      process.env.S3_SECRET_ACCESS_KEY?.trim()
  )
}

function keyPrefix() {
  return (process.env.S3_KEY_PREFIX?.trim() || 'products').replace(
    /^\/+|\/+$/g,
    ''
  )
}

function getS3Client(): S3Client {
  const region = process.env.S3_REGION?.trim() || 'us-east-1'
  const endpoint = process.env.S3_ENDPOINT?.trim()
  const forcePathStyle =
    process.env.S3_FORCE_PATH_STYLE === 'true' ||
    process.env.S3_FORCE_PATH_STYLE === '1'

  return new S3Client({
    region,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!.trim(),
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!.trim(),
    },
    ...(endpoint
      ? {
          endpoint,
          forcePathStyle,
        }
      : {}),
  })
}

function publicUrlForKey(key: string): string {
  const base = process.env.S3_PUBLIC_BASE_URL?.trim()
  if (base) {
    return `${trimSlash(base)}/${key}`
  }

  const bucket = process.env.S3_BUCKET!.trim()
  const region = process.env.S3_REGION?.trim() || 'us-east-1'
  const endpoint = process.env.S3_ENDPOINT?.trim()

  if (endpoint) {
    // Path-style fallback for MinIO / custom endpoints without a CDN URL.
    return `${trimSlash(endpoint)}/${bucket}/${key}`
  }

  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`
}

const LOCAL_UPLOAD_RE = /^\/uploads\/products\/([A-Za-z0-9._-]+)$/

/**
 * Resolve a managed object key (S3) or local filename for URLs we created.
 * External URLs return null and must not be deleted.
 */
export function resolveManagedProductImage(
  url: string | null | undefined
): { kind: 'local'; filename: string } | { kind: 's3'; key: string } | null {
  if (!url || typeof url !== 'string') return null
  const trimmed = url.trim()
  if (!trimmed) return null

  const local = trimmed.match(LOCAL_UPLOAD_RE)
  if (local) {
    return { kind: 'local', filename: local[1] }
  }

  if (!isS3UploadConfigured()) return null

  const prefix = keyPrefix()
  const expectedPrefix = `${prefix}/`

  const publicBase = process.env.S3_PUBLIC_BASE_URL?.trim()
  if (publicBase) {
    const base = `${trimSlash(publicBase)}/`
    if (trimmed.startsWith(base)) {
      const key = trimmed.slice(base.length)
      if (key.startsWith(expectedPrefix) && !key.includes('..')) {
        return { kind: 's3', key }
      }
    }
  }

  const bucket = process.env.S3_BUCKET!.trim()
  const region = process.env.S3_REGION?.trim() || 'us-east-1'
  const endpoint = process.env.S3_ENDPOINT?.trim()

  if (endpoint) {
    const pathStyle = `${trimSlash(endpoint)}/${bucket}/`
    if (trimmed.startsWith(pathStyle)) {
      const key = trimmed.slice(pathStyle.length)
      if (key.startsWith(expectedPrefix) && !key.includes('..')) {
        return { kind: 's3', key }
      }
    }
  }

  const virtualHosted = [
    `https://${bucket}.s3.${region}.amazonaws.com/`,
    `https://${bucket}.s3.amazonaws.com/`,
  ]
  for (const base of virtualHosted) {
    if (trimmed.startsWith(base)) {
      const key = trimmed.slice(base.length)
      if (key.startsWith(expectedPrefix) && !key.includes('..')) {
        return { kind: 's3', key }
      }
    }
  }

  return null
}

async function storeLocal(
  buffer: Buffer,
  filename: string
): Promise<StoredProductImage> {
  const dir = path.join(process.cwd(), 'public', 'uploads', 'products')
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, filename), buffer)
  return { url: `/uploads/products/${filename}`, backend: 'local' }
}

async function storeS3(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<StoredProductImage> {
  const bucket = process.env.S3_BUCKET!.trim()
  const key = `${keyPrefix()}/${filename}`
  const client = getS3Client()

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  )

  return { url: publicUrlForKey(key), backend: 's3' }
}

/**
 * Persist a seller product image. Uses S3-compatible storage when configured;
 * otherwise writes under `public/uploads/products/` for local/dev.
 */
export async function storeProductImage(input: {
  buffer: Buffer
  filename: string
  contentType: string
}): Promise<StoredProductImage> {
  if (isS3UploadConfigured()) {
    return storeS3(input.buffer, input.filename, input.contentType)
  }
  return storeLocal(input.buffer, input.filename)
}

/**
 * Best-effort delete for managed local/S3 product images only.
 * External URLs are skipped. Failures are swallowed (orphan cleanup).
 */
export async function deleteManagedProductImage(
  url: string | null | undefined
): Promise<'deleted' | 'skipped' | 'failed'> {
  const managed = resolveManagedProductImage(url)
  if (!managed) return 'skipped'

  try {
    if (managed.kind === 'local') {
      const filePath = path.join(
        process.cwd(),
        'public',
        'uploads',
        'products',
        managed.filename
      )
      await unlink(filePath)
      return 'deleted'
    }

    if (!isS3UploadConfigured()) return 'skipped'
    await getS3Client().send(
      new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET!.trim(),
        Key: managed.key,
      })
    )
    return 'deleted'
  } catch {
    return 'failed'
  }
}

/** Delete previous managed URLs that are no longer referenced. */
export async function deleteOrphanedProductImages(
  previousUrls: Array<string | null | undefined>,
  nextUrls: Array<string | null | undefined>
): Promise<void> {
  const keep = new Set(
    nextUrls
      .filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
      .map((u) => u.trim())
  )
  for (const url of previousUrls) {
    if (!url || keep.has(url.trim())) continue
    await deleteManagedProductImage(url)
  }
}
