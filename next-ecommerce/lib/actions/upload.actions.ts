'use server'

import { randomUUID } from 'crypto'
import { auth } from '@/auth'
import { hasSellerAccess } from '@/lib/auth/roles'
import { storeProductImage } from '@/lib/storage/product-images'
import { formatError } from '@/lib/utils'

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
}

export async function uploadSellerProductImage(formData: FormData): Promise<
  { success: true; url: string } | { success: false; message: string }
> {
  try {
    const session = await auth()
    if (!session?.user?.id || !hasSellerAccess(session.user.role)) {
      return { success: false, message: 'Seller role required' }
    }

    const file = formData.get('file')
    if (!file || !(file instanceof File)) {
      return { success: false, message: 'Image file required' }
    }
    if (!ALLOWED[file.type]) {
      return {
        success: false,
        message: 'Use JPEG, PNG, WebP, or GIF',
      }
    }
    if (file.size <= 0 || file.size > MAX_BYTES) {
      return { success: false, message: 'Image must be between 1 byte and 5MB' }
    }

    const ext = ALLOWED[file.type]
    const filename = `${randomUUID()}${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())
    const stored = await storeProductImage({
      buffer,
      filename,
      contentType: file.type,
    })

    return { success: true, url: stored.url }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}
