'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { updateAdminCatalogProduct } from '@/lib/actions/admin.actions'

export default function AdminCatalogPublishToggle({
  productId,
  isPublished,
}: {
  productId: string
  isPublished: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <Button
      type='button'
      size='sm'
      variant='outline'
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const result = await updateAdminCatalogProduct(productId, {
            isPublished: !isPublished,
          })
          if (!result.success) {
            toast.error(result.message || 'Update failed')
            return
          }
          toast.success(isPublished ? 'Unpublished' : 'Published')
          router.refresh()
        })
      }}
    >
      {pending ? '…' : isPublished ? 'Unpublish' : 'Publish'}
    </Button>
  )
}
