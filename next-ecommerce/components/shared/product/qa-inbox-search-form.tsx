import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function QaInboxSearchForm({
  action,
  query,
  hiddenFields,
}: {
  action: string
  query?: string | null
  hiddenFields?: Record<string, string>
}) {
  return (
    <form
      action={action}
      method='get'
      className='flex flex-wrap items-center gap-2'
    >
      {hiddenFields
        ? Object.entries(hiddenFields).map(([name, value]) => (
            <input key={name} type='hidden' name={name} value={value} />
          ))
        : null}
      <input
        type='search'
        name='q'
        defaultValue={query || ''}
        placeholder='Search product, question, asker…'
        className='min-w-[220px] flex-1 rounded-md border bg-background px-3 py-2 text-sm'
        maxLength={80}
      />
      <Button type='submit' size='sm' variant='secondary'>
        Search
      </Button>
      {query ? (
        <Link
          href={
            hiddenFields && Object.keys(hiddenFields).length
              ? `${action}?${new URLSearchParams(hiddenFields).toString()}`
              : action
          }
          className='text-sm text-muted-foreground underline'
        >
          Clear
        </Link>
      ) : null}
    </form>
  )
}
