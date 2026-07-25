'use server'

import { randomUUID } from 'crypto'
import { auth } from '@/auth'
import { hasSellerAccess } from '@/lib/auth/roles'
import { updateSellerProduct } from '@/lib/actions/seller.actions'
import {
  deleteManagedProductImage,
  deleteOrphanedProductImages,
  storeProductImage,
} from '@/lib/storage/product-images'
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

/**
 * Upload a new image, patch the product, then delete the previous managed file.
 */
export async function replaceSellerProductImage(
  productId: string,
  formData: FormData,
  previousUrl?: string | null
): Promise<{ success: true; url: string } | { success: false; message: string }> {
  const uploaded = await uploadSellerProductImage(formData)
  if (!uploaded.success) return uploaded

  const updated = await updateSellerProduct(productId, {
    images: [uploaded.url],
  })
  if (!updated.success) {
    await deleteManagedProductImage(uploaded.url)
    return {
      success: false,
      message: updated.message || 'Could not update image',
    }
  }

  await deleteOrphanedProductImages([previousUrl], [uploaded.url])
  return { success: true, url: uploaded.url }
}

/** Clear product images and delete the previous managed file when applicable. */
export async function removeSellerProductImage(
  productId: string,
  previousUrl?: string | null
): Promise<{ success: true } | { success: false; message: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id || !hasSellerAccess(session.user.role)) {
      return { success: false, message: 'Seller role required' }
    }

    const updated = await updateSellerProduct(productId, { images: [] })
    if (!updated.success) {
      return {
        success: false,
        message: updated.message || 'Could not remove image',
      }
    }

    await deleteOrphanedProductImages([previousUrl], [])
    return { success: true }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}
