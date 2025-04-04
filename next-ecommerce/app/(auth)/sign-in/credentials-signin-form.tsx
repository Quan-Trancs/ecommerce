'use client'

import { UserSignInSchema } from '@/lib/validator'
import { IUserSignIn } from '@/types'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signInWithcredentials } from '@/lib/actions/user.actions'
import { redirect, useSearchParams } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { toast } from 'sonner'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { APP_NAME } from '@/lib/constants'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const signInDefaultValues =
  process.env.NODE_ENV === 'development'
    ? {
        email: 'admin@example.com',
        password: 'changeme',
      }
    : { email: '', password: '' }

export default function CredentialsSignInForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  const form = useForm<IUserSignIn>({
    resolver: zodResolver(UserSignInSchema),
    defaultValues: signInDefaultValues,
  })

  const { control, handleSubmit } = form

  const onSubmit = async (data: IUserSignIn) => {
    try {
      await signInWithcredentials({
        email: data.email,
        password: data.password,
      })
      redirect(callbackUrl)
    } catch (error) {
      if (isRedirectError(error)) {
        throw error
      }
      toast.error('Error', {
        description: 'Invalid Email or Password',
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input type='hidden' name='callbackUrl' value={callbackUrl} />
        <div className='space-y-6'>
          <FormField
            control={control}
            name='email'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder='Enter Email address'
                    {...field}
                    className='border-1 border-gray-500'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name='password'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type='password'
                    placeholder='Enter Password'
                    {...field}
                    className='border-1 border-gray-500'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div>
            <Button type='submit' className='w-full rounded-2xl'>
              Sign In
            </Button>
          </div>
          <div className='text-xs'>
            By signing in, you agree to {APP_NAME}&apos;s{' '}
            <Link href='/page/conditions-of-use' className='underline '>
              Conditions of Use
            </Link>{' '}
            and{' '}
            <Link href='/page/privacy-policy' className='underline'>
              Privacy Notice.
            </Link>
          </div>
        </div>
      </form>
    </Form>
  )
}
