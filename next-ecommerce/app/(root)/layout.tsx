import Footer from '@/components/shared/footer'
import Header from '@/components/shared/header'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className='flex min-h-screen flex-col'>
      <Header />
      <main className='flex-1 flex flex-col p-4'>{children}</main>
      <Footer />
    </div>
  )
}
