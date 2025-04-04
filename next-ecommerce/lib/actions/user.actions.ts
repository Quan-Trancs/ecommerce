'use server'
import { signIn, signOut } from '@/auth'
import { IUserSignIn, IUserSignUp } from '@/types'
import { redirect } from 'next/navigation'
import { UserSignUpSchema } from '../validator'
import { connectToDatabase } from '../db'
import User from '../db/models/user.model'
import bcrypt from 'bcryptjs'
import { formatError } from '../utils'

export async function signInWithCredentials(user: IUserSignIn) {
  return await signIn('credentials', { ...user, redirect: false })
}

export const SignOut = async () => {
  const redirectTo = await signOut({ redirect: false })
  redirect(redirectTo.redirect)
}

export async function registerUser(UserSignUp: IUserSignUp) {
  try {
    const user = await UserSignUpSchema.parseAsync({
      name: UserSignUp.name,
      email: UserSignUp.email,
      password: UserSignUp.password,
      confirmPassword: UserSignUp.confirmPassword,
    })

    await connectToDatabase()
    await User.create({
      ...user,
      password: await bcrypt.hash(user.password, 5),
    })

    return { success: true, message: 'User registered successfully' }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}
