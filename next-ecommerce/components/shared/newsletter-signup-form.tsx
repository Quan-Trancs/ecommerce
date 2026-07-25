'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { subscribeNewsletter } from '@/lib/actions/newsletter.actions'

export default function NewsletterSignupForm({
  source = 'footer',
  className,
}: {
  source?: string
  className?: string
}) {
  const [email, setEmail] = useState('')
  const [pending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await subscribeNewsletter({ email, source })
      if (!result.success) {
        toast.error(result.message)
        return
      }
      toast.success(result.message)
      setEmail('')
    })
  }

  return (
    <form onSubmit={onSubmit} className={className}>
      <p className='mb-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-primary'>
        Newsletter
      </p>
      <p className='mb-3 text-sm text-white/75'>
        Deals and new arrivals — unsubscribe anytime.
      </p>
      <div className='flex flex-col gap-2 sm:flex-row'>
        <Input
          type='email'
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder='you@example.com'
          disabled={pending}
          className='border-white/20 bg-white/10 text-white placeholder:text-white/40'
        />
        <Button
          type='submit'
          disabled={pending}
          className='shrink-0 bg-primary text-primary-foreground hover:bg-primary/90'
        >
          {pending ? 'Saving…' : 'Subscribe'}
        </Button>
      </div>
    </form>
  )
}
