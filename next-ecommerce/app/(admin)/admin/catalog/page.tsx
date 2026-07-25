export const metadata = { title: 'Admin catalog' }

export default function AdminCatalogPage() {
  return (
    <div className='space-y-3'>
      <h2 className='text-xl font-semibold'>Catalog moderation</h2>
      <p className='text-sm text-muted-foreground'>
        Structure ready: reuse <code>/api/v1/admin/products</code> for
        platform-wide create/update.
      </p>
      <div className='rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground'>
        Admin product UI not connected yet.
      </div>
    </div>
  )
}
