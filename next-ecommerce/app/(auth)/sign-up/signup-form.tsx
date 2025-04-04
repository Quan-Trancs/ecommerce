'use client'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { registerUser, signInWithCredentials } from '@/lib/actions/user.actions'
import { UserSignUpSchema } from '@/lib/validator'
import { IUserSignUp } from '@/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import Link from 'next/link'
import { redirect, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { APP_NAME } from '@/lib/constants'

const signUpDefaultValues =
  process.env.NODE_ENV === 'development'
    ? {
        name: 'John Doe',
        email: 'admin@example.com',
        password: 'changeme',
        confirmPassword: 'changeme',
      }
    : {
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
      }

export default function SignUpForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  const form = useForm<IUserSignUp>({
    resolver: zodResolver(UserSignUpSchema),
    defaultValues: signUpDefaultValues,
  })

  const { control, handleSubmit } = form

  const onSubmit = async (data: IUserSignUp) => {
    try {
      const response = await registerUser(data)
      if (!response.success) {
        toast.error('Error', { description: response.message })
        return
      }

      await signInWithCredentials({
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
        <div className='space-y-3'>
          <FormField
            control={control}
            name='name'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>Your name</FormLabel>
                <FormControl>
                  <Input
                    autoFocus
                    placeholder='first and last name'
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
            name='email'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder='Enter email address'
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
                    placeholder='At least 6 characters'
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
            name='confirmPassword'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>Re-enter password</FormLabel>
                <FormControl>
                  <Input
                    type='password'
                    {...field}
                    className='border-1 border-gray-500'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div>
            <Button type='submit' className='w-full rounded-2xl' size={'sm'}>
              Sign Up
            </Button>
          </div>
          <div className='text-xs mt-5'>
            By creating an account, you agree to {APP_NAME}&apos;s{' '}
            <Link href='/page/conditions-of-use'>Conditions of Use</Link> and{' '}
            <Link href='/page/privacy-policy'> Privacy Notice. </Link>
          </div>
          <Separator className='h-5 border-b my-5 border-gray-300' />
          <div className='text-xs mb-3'>
            Already have an account?{' '}
            <Link className='link' href={`/sign-in?callbackUrl=${callbackUrl}`}>
              Sign in&gt;
            </Link>
          </div>
        </div>
      </form>
    </Form>
  )
}
