'use client'

import { useCSRF } from '@/hooks/use-csrf'

interface CSRFFormProps {
  children: any
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  action?: string
  className?: string
  onSubmit?: (e: any) => void
}

export default function CSRFForm({ 
  children, 
  method = 'POST', 
  action,
  className,
  onSubmit,
  ...props 
}: CSRFFormProps) {
  const { csrfToken, isLoading } = useCSRF()

  if (isLoading) {
    return (
      <form method={method} action={action} className={className} {...props}>
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-2">Loading...</span>
        </div>
      </form>
    )
  }

  return (
    <form method={method} action={action} className={className} onSubmit={onSubmit} {...props}>
      {/* Hidden CSRF token field */}
      <input type="hidden" name="csrf" value={csrfToken || ''} />
      {/* CSRF token header for AJAX requests */}
      <input type="hidden" name="x-csrf-token" value={csrfToken || ''} />
      {children}
    </form>
  )
} 