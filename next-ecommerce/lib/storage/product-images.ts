import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

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
  const prefix = (process.env.S3_KEY_PREFIX?.trim() || 'products').replace(
    /^\/+|\/+$/g,
    ''
  )
  const key = `${prefix}/${filename}`
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
