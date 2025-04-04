import { auth } from '@/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { redirect } from 'next/navigation'
import CredentialsSignInForm from './credentials-signin-form'
import SeparatorOr from '@/components/shared/separator-or'
import { APP_NAME } from '@/lib/constants'
import Link from 'next/link'
import { Button } from '@/components/ui/custom/custom-button'
export default async function SignIn(props: {
  searchParams: Promise<{
    callBackUrl: string
  }>
}) {
  const searchParams = await props.searchParams

  const { callBackUrl = '/' } = searchParams

  const session = await auth()

  if (session) {
    return redirect(callBackUrl)
  }

  return (
    <div className='w-full'>
      <Card className='rounded-2xl border-1 border-gray-300'>
        <CardHeader>
          <CardTitle className='text-2xl'>Sign in</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <CredentialsSignInForm />
          </div>
        </CardContent>
      </Card>
      <SeparatorOr>New to {APP_NAME}?</SeparatorOr>

      <Link href={`/sign-up?callbackUrl=${encodeURIComponent(callBackUrl)}`}>
        <Button
          className='w-full text-[#0f1111] text-xs px-[10px] py-1.5 font-normal border-gray-500 rounded-full h-auto'
          variant={'outline'}
        >
          Create your {APP_NAME} account
        </Button>
      </Link>
    </div>
  )
}
