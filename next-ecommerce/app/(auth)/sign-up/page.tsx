import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import SignUpForm from './signup-form'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'

export default async function SignUpPage(props: {
  searchParams: Promise<{ callBackUrl: string }>
}) {
  const searchParams = await props.searchParams

  const { callBackUrl } = searchParams

  const session = await auth()

  if (session) {
    return redirect(callBackUrl || '/')
  }

  return (
    <div className='w-full'>
      <Card className='rounded-2xl border-1 border-gray-300 py-1 gap-3'>
        <CardHeader>
          <CardTitle className='text-[28px]'>Create account</CardTitle>
        </CardHeader>
        <CardContent>
          <SignUpForm />
        </CardContent>
      </Card>
    </div>
  )
}
