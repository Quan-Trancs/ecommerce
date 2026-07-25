'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Rating from '@/components/shared/product/rating'
import {
  removeMyProductReview,
  submitProductReview,
  type ProductReview,
} from '@/lib/actions/review.actions'
import { cn, formatDateTime } from '@/lib/utils'

export default function ProductReviewsPanel({
  productId,
  productSlug,
  signedIn,
  canReview,
  myReview,
  reviews,
  avgRating,
  numReviews,
  ratingDistribution,
}: {
  productId: string
  productSlug: string
  signedIn: boolean
  canReview: boolean
  myReview: ProductReview | null
  reviews: ProductReview[]
  avgRating: number
  numReviews: number
  ratingDistribution: { rating: number; count: number }[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [rating, setRating] = useState(myReview?.rating || 5)
  const [title, setTitle] = useState(myReview?.title || '')
  const [body, setBody] = useState(myReview?.body || '')

  useEffect(() => {
    setRating(myReview?.rating || 5)
    setTitle(myReview?.title || '')
    setBody(myReview?.body || '')
  }, [myReview])

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    startTransition(async () => {
      const result = await submitProductReview({
        productId,
        productSlug,
        rating,
        title,
        body,
      })
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  const maxBucket = Math.max(1, ...ratingDistribution.map((d) => d.count))

  return (
    <section className='brick space-y-6 p-4 md:p-5'>
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div>
          <p className='brick-label'>Customer reviews</p>
          <div className='mt-2 flex flex-wrap items-center gap-2'>
            <span className='text-2xl font-bold text-chrome'>
              {numReviews ? avgRating.toFixed(1) : '—'}
            </span>
            <Rating rating={numReviews ? avgRating : 0} />
            <span className='text-sm text-muted-foreground'>
              {numReviews} review{numReviews === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </div>

      {numReviews > 0 ? (
        <ul className='space-y-2'>
          {[...ratingDistribution].reverse().map((bucket) => (
            <li key={bucket.rating} className='flex items-center gap-2 text-sm'>
              <span className='w-12 shrink-0'>{bucket.rating} star</span>
              <div className='h-2 flex-1 overflow-hidden rounded bg-muted'>
                <div
                  className='h-full bg-amber-400'
                  style={{
                    width: `${(bucket.count / maxBucket) * 100}%`,
                  }}
                />
              </div>
              <span className='w-8 text-right text-muted-foreground'>
                {bucket.count}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {canReview ? (
        <form onSubmit={onSubmit} className='space-y-3 border-t pt-4'>
          <p className='text-sm font-medium'>
            {myReview ? 'Update your review' : 'Write a review'}
          </p>
          <div className='flex flex-wrap items-center gap-2'>
            <span className='text-sm text-muted-foreground'>Rating</span>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type='button'
                disabled={pending}
                className={cn(
                  'rounded border px-2 py-1 text-sm',
                  rating === value
                    ? 'border-amber-500 bg-amber-500/15 font-semibold'
                    : 'hover:bg-muted'
                )}
                onClick={() => setRating(value)}
              >
                {value}
              </button>
            ))}
          </div>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='Title (optional)'
            maxLength={200}
            disabled={pending}
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            maxLength={4000}
            placeholder='What did you think of this product?'
            className='border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:opacity-50'
            disabled={pending}
            required
          />
          <div className='flex flex-wrap gap-2'>
            <Button type='submit' disabled={pending || body.trim().length < 10}>
              {pending ? 'Saving…' : myReview ? 'Update review' : 'Submit review'}
            </Button>
            {myReview ? (
              <Button
                type='button'
                variant='outline'
                disabled={pending}
                onClick={() => {
                  startTransition(async () => {
                    const result = await removeMyProductReview({
                      productId,
                      productSlug,
                    })
                    if (result.success) {
                      setTitle('')
                      setBody('')
                      setRating(5)
                      toast.success(result.message)
                      router.refresh()
                    } else {
                      toast.error(result.message)
                    }
                  })
                }}
              >
                Remove
              </Button>
            ) : null}
          </div>
        </form>
      ) : signedIn ? (
        <p className='border-t pt-4 text-sm text-muted-foreground'>
          Purchase this product to leave a verified review.
        </p>
      ) : (
        <p className='border-t pt-4 text-sm text-muted-foreground'>
          <Link href='/sign-in' className='text-primary underline'>
            Sign in
          </Link>{' '}
          after purchasing to leave a review.
        </p>
      )}

      <div className='space-y-3 border-t pt-4'>
        {reviews.length === 0 ? (
          <p className='text-sm text-muted-foreground'>No reviews yet.</p>
        ) : (
          reviews.map((review) => (
            <article
              key={review.id}
              className='rounded-md border bg-muted/20 px-3 py-3 text-sm'
            >
              <div className='mb-1 flex flex-wrap items-center gap-2'>
                <span className='font-medium'>{review.authorName}</span>
                <Rating rating={review.rating} size={4} />
                <span className='text-xs text-muted-foreground'>
                  {formatDateTime(new Date(review.createdAt)).dateTime}
                </span>
              </div>
              {review.title ? (
                <p className='font-medium'>{review.title}</p>
              ) : null}
              <p className='mt-1 whitespace-pre-wrap text-muted-foreground'>
                {review.body}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  )
}
