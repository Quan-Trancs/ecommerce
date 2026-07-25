import Footer from '@/components/shared/footer'
import Header from '@/components/shared/header'

export default function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className='flex min-h-screen flex-col'>
      <Header />
      <main className='flex flex-1 flex-col'>{children}</main>
      <Footer />
    </div>
  )
}
